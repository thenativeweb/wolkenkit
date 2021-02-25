import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isCustomError } from 'defekt';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const logger = flaschenpost.getLogger();

const getDomainEventsByCorrelationId = {
  description: 'Streams all domain events with a matching correlation id.',
  path: 'domain-events-by-correlation-id',

  request: {
    query: {
      type: 'object',
      properties: {
        'correlation-id': { type: 'string', format: 'uuid' }
      },
      required: [ 'correlation-id' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200 ],

    stream: true,
    body: getDomainEventSchema()
  },

  getHandler ({
    domainEventStore,
    heartbeatInterval
  }: {
    domainEventStore: DomainEventStore;
    heartbeatInterval: number;
  }): WolkenkitRequestHandler {
    const querySchema = new Value(getDomainEventsByCorrelationId.request.query),
          responseBodySchema = new Value(getDomainEventsByCorrelationId.response.body);

    return async function (req, res): Promise<any> {
      try {
        try {
          querySchema.validate(req.query, { valueName: 'requestQuery' });
        } catch (ex: unknown) {
          res.status(400).end((ex as Error).message);
        }

        const correlationId = req.query['correlation-id'] as string;

        res.startStream({ heartbeatInterval });

        const domainEventStream = await domainEventStore.getDomainEventsByCorrelationId({ correlationId });

        for await (const domainEvent of domainEventStream) {
          try {
            responseBodySchema.validate(domainEvent, { valueName: 'responseBody' });

            writeLine({ res, data: domainEvent });
          } catch {
            logger.warn(
              'Dropped invalid domain event.',
              withLogMetadata('api', 'queryDomainEventStore', { domainEvent })
            );
          }
        }

        return res.end();
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
          case errors.RequestMalformed.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'queryDomainEventStore', { error })
            );

            res.status(500).json({
              code: error.code,
              message: error.message
            });
          }
        }
      }
    };
  }
};

export { getDomainEventsByCorrelationId };

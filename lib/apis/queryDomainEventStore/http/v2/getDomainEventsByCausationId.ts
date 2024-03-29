import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isCustomError } from 'defekt';
import { Parser } from 'validate-value';
import { Schema } from '../../../../common/elements/Schema';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const getDomainEventsByCausationId = {
  description: 'Streams all domain events with a matching causation id.',
  path: 'domain-events-by-causation-id',

  request: {
    query: {
      type: 'object',
      properties: {
        'causation-id': { type: 'string', format: 'uuid' }
      },
      required: [ 'causation-id' ],
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
    const queryParser = new Parser(getDomainEventsByCausationId.request.query),
          responseBodyParser = new Parser(getDomainEventsByCausationId.response.body);

    return async function (req, res): Promise<any> {
      try {
        queryParser.parse(
          req.query,
          { valueName: 'requestQuery' }
        ).unwrapOrThrow(
          (err): Error => new errors.RequestMalformed(err.message)
        );

        const causationId = req.query['causation-id'] as string;

        res.startStream({ heartbeatInterval });

        const domainEventStream = await domainEventStore.getDomainEventsByCausationId({ causationId });

        for await (const domainEvent of domainEventStream) {
          try {
            responseBodyParser.parse(
              domainEvent,
              { valueName: 'responseBody' }
            ).unwrapOrThrow();

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
          new errors.UnknownError({ cause: ex as Error });

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

export { getDomainEventsByCausationId };

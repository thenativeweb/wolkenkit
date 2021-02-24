import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isCustomError } from 'defekt';
import { regex } from '../../../../common/utils/uuid';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const logger = flaschenpost.getLogger();

const getReplayForAggregate = {
  description: `Streams a replay of an aggregate's domain events, optionally starting and ending at given revisions.`,
  path: 'replay/:aggregateId',

  request: {
    query: {
      type: 'object',
      properties: {
        fromRevision: { type: 'number', minimum: 1 },
        toRevision: { type: 'number', minimum: 1 }
      },
      required: [],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400 ],

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
    const querySchema = new Value(getReplayForAggregate.request.query),
          responseBodySchema = new Value(getReplayForAggregate.response.body);

    return async function (req, res): Promise<any> {
      try {
        try {
          querySchema.validate(req.query, { valueName: 'requestQuery' });
        } catch (ex: unknown) {
          throw new errors.RequestMalformed((ex as Error).message);
        }

        const fromRevision = req.query.fromRevision as number,
              toRevision = req.query.toRevision as number;

        if (fromRevision && toRevision && fromRevision > toRevision) {
          throw new errors.RequestMalformed(`Query parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
        }

        const { aggregateId } = req.params;

        if (!regex.test(aggregateId)) {
          throw new errors.RequestMalformed('Aggregate id must be a uuid.');
        }

        res.startStream({ heartbeatInterval });

        const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId, fromRevision, toRevision });

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
              withLogMetadata('api', 'queryDomainEventStore', { err: error })
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

export { getReplayForAggregate };

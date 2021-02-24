import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isCustomError } from 'defekt';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const getLastDomainEvent = {
  description: 'Returns the last domain event.',
  path: 'last-domain-event',

  request: {
    query: {
      type: 'object',
      properties: {
        aggregateIdentifier: getAggregateIdentifierSchema()
      },
      required: [ 'aggregateIdentifier' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 404 ],

    body: getDomainEventSchema()
  },

  getHandler ({
    domainEventStore
  }: {
    domainEventStore: DomainEventStore;
  }): WolkenkitRequestHandler {
    const querySchema = new Value(getLastDomainEvent.request.query),
          responseBodySchema = new Value(getLastDomainEvent.response.body);

    return async function (req, res): Promise<any> {
      try {
        const { aggregateIdentifier } = req.query;

        try {
          querySchema.validate(req.query, { valueName: 'requestQuery' });
        } catch (ex: unknown) {
          throw new errors.AggregateIdentifierMalformed((ex as Error).message);
        }

        const lastDomainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

        if (!lastDomainEvent) {
          throw new errors.DomainEventNotFound();
        }

        responseBodySchema.validate(lastDomainEvent, { valueName: 'responseBody' });

        res.json(lastDomainEvent);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
          case errors.AggregateIdentifierMalformed.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.DomainEventNotFound.code: {
            res.status(404).json({
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

            return res.status(400).json({
              code: error.code,
              message: error.message
            });
          }
        }
      }
    };
  }
};

export { getLastDomainEvent };

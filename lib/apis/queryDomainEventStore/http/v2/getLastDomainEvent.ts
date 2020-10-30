import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { CustomError, isCustomError } from 'defekt';

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
      const { aggregateIdentifier } = req.query;

      try {
        querySchema.validate(req.query, { valueName: 'requestQuery' });
      } catch (ex: unknown) {
        const error = new errors.AggregateIdentifierMalformed((ex as Error).message);

        return res.status(400).json({
          code: error.code,
          message: error.message
        });
      }

      try {
        const lastDomainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

        if (!lastDomainEvent) {
          return res.status(404).end();
        }

        responseBodySchema.validate(lastDomainEvent, { valueName: 'responseBody' });

        res.json(lastDomainEvent);
      } catch (ex: unknown) {
        let error: CustomError;

        if (isCustomError(ex)) {
          error = ex;
        } else {
          error = new errors.UnknownError(undefined, { cause: ex as Error });
        }

        logger.error('An unknown error occured.', { ex: error });

        return res.status(400).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { getLastDomainEvent };

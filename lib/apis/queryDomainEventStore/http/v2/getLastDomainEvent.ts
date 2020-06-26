import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { Value } from 'validate-value';
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
    }
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
        querySchema.validate(req.query);
      } catch (ex) {
        const error = new errors.AggregateIdentifierMalformed(ex.message);

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

        responseBodySchema.validate(lastDomainEvent);

        res.json(lastDomainEvent);
      } catch (ex) {
        logger.error('Unknown error occured.', { ex });

        return res.status(400).json({
          code: ex.code ?? 'EUNKNOWNERROR',
          message: ex.message
        });
      }
    };
  }
};

export { getLastDomainEvent };

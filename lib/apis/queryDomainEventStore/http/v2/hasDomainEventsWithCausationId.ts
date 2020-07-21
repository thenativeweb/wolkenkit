import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { jsonSchema } from 'uuidv4';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const hasDomainEventsWithCausationId = {
  description: 'Checks wether domain events with a given causation id exist.',
  path: 'has-domain-events-with-causation-id',

  request: {
    query: {
      type: 'object',
      properties: {
        'causation-id': jsonSchema.v4
      },
      required: [ 'causation-id' ],
      additionalProperties: false
    }
  },
  response: {
    statusCodes: [ 200 ],

    body: {
      type: 'object',
      properties: {
        hasDomainEventsWithCausationId: { type: 'boolean' }
      },
      required: [ 'hasDomainEventsWithCausationId' ],
      additionalProperties: false
    }
  },

  getHandler ({
    domainEventStore
  }: {
    domainEventStore: DomainEventStore;
  }): WolkenkitRequestHandler {
    const querySchema = new Value(hasDomainEventsWithCausationId.request.query),
          responseBodySchema = new Value(hasDomainEventsWithCausationId.response.body);

    return async function (req, res): Promise<any> {
      let causationId;

      try {
        querySchema.validate(req.query, { valueName: 'requestQuery' });

        causationId = req.query['causation-id'] as string;
      } catch (ex) {
        res.status(400).end();

        return;
      }

      try {
        const hasDomainEvents = await domainEventStore.hasDomainEventsWithCausationId({ causationId }),
              response = { hasDomainEventsWithCausationId: hasDomainEvents };

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.json(response);
      } catch (ex) {
        logger.error('An unknown error occured.', { ex });

        return res.status(400).json({
          code: ex.code ?? errors.UnknownError.code,
          message: ex.message
        });
      }
    };
  }
};

export { hasDomainEventsWithCausationId };

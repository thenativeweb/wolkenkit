import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { jsonSchema } from '../../../../common/utils/uuid';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { CustomError, isCustomError } from 'defekt';

const logger = flaschenpost.getLogger();

const hasDomainEventsWithCausationId = {
  description: 'Checks wether domain events with a given causation id exist.',
  path: 'has-domain-events-with-causation-id',

  request: {
    query: {
      type: 'object',
      properties: {
        'causation-id': jsonSchema
      },
      required: [ 'causation-id' ],
      additionalProperties: false
    } as Schema
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
    } as Schema
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
      } catch {
        res.status(400).end();

        return;
      }

      try {
        const hasDomainEvents = await domainEventStore.hasDomainEventsWithCausationId({ causationId }),
              response = { hasDomainEventsWithCausationId: hasDomainEvents };

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.json(response);
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

export { hasDomainEventsWithCausationId };

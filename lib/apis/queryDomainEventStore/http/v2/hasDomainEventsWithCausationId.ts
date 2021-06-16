import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { isCustomError } from 'defekt';
import { Parser } from 'validate-value';
import { Schema } from '../../../../common/elements/Schema';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const hasDomainEventsWithCausationId = {
  description: 'Checks wether domain events with a given causation id exist.',
  path: 'has-domain-events-with-causation-id',

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
    const queryParser = new Parser(hasDomainEventsWithCausationId.request.query),
          responseBodyParser = new Parser(hasDomainEventsWithCausationId.response.body);

    return async function (req, res): Promise<any> {
      try {
        queryParser.parse(
          req.query,
          { valueName: 'requestQuery' }
        ).unwrapOrThrow(
          (err): Error => new errors.RequestMalformed(err.message)
        );

        const causationId: string = req.query['causation-id'];

        const hasDomainEvents = await domainEventStore.hasDomainEventsWithCausationId({ causationId }),
              response = { hasDomainEventsWithCausationId: hasDomainEvents };

        responseBodyParser.parse(
          response,
          { valueName: 'responseBody' }
        ).unwrapOrThrow();

        res.json(response);
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

export { hasDomainEventsWithCausationId };

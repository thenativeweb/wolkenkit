import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isCustomError } from 'defekt';
import { Parser } from 'validate-value';
import { GraphqlIncompatibleSchema } from '../../../../common/elements/Schema';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

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
    } as GraphqlIncompatibleSchema
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
    const queryParser = new Parser(getLastDomainEvent.request.query),
          responseBodyParser = new Parser(getLastDomainEvent.response.body);

    return async function (req, res): Promise<any> {
      try {
        const { aggregateIdentifier } = req.query;

        queryParser.parse(
          req.query,
          { valueName: 'requestQuery' }
        ).unwrapOrThrow(
          (err): Error => new errors.AggregateIdentifierMalformed(err.message)
        );

        const lastDomainEvent = await domainEventStore.getLastDomainEvent({ aggregateIdentifier });

        if (!lastDomainEvent) {
          throw new errors.DomainEventNotFound();
        }

        responseBodyParser.parse(
          lastDomainEvent,
          { valueName: 'responseBody' }
        ).unwrapOrThrow();

        res.json(lastDomainEvent);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError({ cause: ex as Error });

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

export { getLastDomainEvent };

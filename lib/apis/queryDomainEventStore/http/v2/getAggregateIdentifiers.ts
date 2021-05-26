import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { GraphqlIncompatibleSchema } from '../../../../common/elements/Schema';
import { isCustomError } from 'defekt';
import { Parser } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const getAggregateIdentifiers = {
  description: 'Streams all aggregate identifiers that have domain events in the store.',
  path: 'get-aggregate-identifiers',

  request: {
    query: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    } as GraphqlIncompatibleSchema
  },
  response: {
    statusCodes: [ 200, 400 ],

    stream: true,
    body: getAggregateIdentifierSchema()
  },

  getHandler ({
    domainEventStore,
    heartbeatInterval
  }: {
    domainEventStore: DomainEventStore;
    heartbeatInterval: number;
  }): WolkenkitRequestHandler {
    const queryParser = new Parser(getAggregateIdentifiers.request.query),
          responseBodyParser = new Parser(getAggregateIdentifiers.response.body);

    return async function (req, res): Promise<any> {
      try {
        queryParser.parse(
          req.query,
          { valueName: 'requestQuery' }
        ).unwrapOrThrow(
          (err): Error => new errors.RequestMalformed(err.message)
        );

        res.startStream({ heartbeatInterval });

        const aggregateIdentifierStream = await domainEventStore.getAggregateIdentifiers();

        for await (const aggregateIdentifier of aggregateIdentifierStream) {
          try {
            responseBodyParser.parse(
              aggregateIdentifier,
              { valueName: 'responseBody' }
            ).unwrapOrThrow();

            writeLine({ res, data: aggregateIdentifier });
          } catch {
            logger.warn(
              'Dropped invalid aggregate identifier.',
              withLogMetadata('api', 'queryDomainEventStore', { aggregateIdentifier })
            );
          }
        }

        res.end();

        return;
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

export { getAggregateIdentifiers };

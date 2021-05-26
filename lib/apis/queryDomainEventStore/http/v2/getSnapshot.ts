import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { getSnapshotSchema } from '../../../../common/schemas/getSnapshotSchema';
import { isCustomError } from 'defekt';
import { Parser } from 'validate-value';
import { GraphqlIncompatibleSchema } from '../../../../common/elements/Schema';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const getSnapshot = {
  description: 'Returns the latest snapshot for an aggeragte.',
  path: 'snapshot',

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

    body: getSnapshotSchema()
  },

  getHandler ({
    domainEventStore
  }: {
    domainEventStore: DomainEventStore;
  }): WolkenkitRequestHandler {
    const queryParser = new Parser(getSnapshot.request.query),
          responseBodyParser = new Parser(getSnapshot.response.body);

    return async function (req, res): Promise<any> {
      try {
        const { aggregateIdentifier } = req.query;

        queryParser.parse(
          req.query,
          { valueName: 'requestQuery' }
        ).unwrapOrThrow(
          (err): Error => new errors.RequestMalformed(err.message)
        );

        const snapshot = await domainEventStore.getSnapshot({ aggregateIdentifier });

        if (!snapshot) {
          throw new errors.SnapshotNotFound();
        }

        responseBodyParser.parse(
          snapshot,
          { valueName: 'responseBody' }
        ).unwrapOrThrow();

        res.json(snapshot);
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
          case errors.SnapshotNotFound.code: {
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

export { getSnapshot };

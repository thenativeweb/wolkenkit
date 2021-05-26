import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getSnapshotSchema } from '../../../../common/schemas/getSnapshotSchema';
import { GraphqlIncompatibleSchema } from '../../../../common/elements/Schema';
import { isCustomError } from 'defekt';
import { Parser } from 'validate-value';
import { validateContentType } from '../../../base/validateContentType';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const storeSnapshot = {
  description: 'Stores a snapshot.',
  path: 'store-snapshot',

  request: {
    body: getSnapshotSchema()
  },
  response: {
    statusCodes: [ 200, 400, 415 ],

    body: { type: 'object' } as GraphqlIncompatibleSchema
  },

  getHandler ({
    domainEventStore
  }: {
    domainEventStore: DomainEventStore;
  }): WolkenkitRequestHandler {
    const requestBodyParser = new Parser(storeSnapshot.request.body),
          responseBodyParser = new Parser(storeSnapshot.response.body);

    return async function (req, res): Promise<any> {
      try {
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

        const snapshot = req.body;

        requestBodyParser.parse(
          snapshot,
          { valueName: 'requestBody' }
        ).unwrapOrThrow(
          (err): Error => new errors.SnapshotMalformed(err.message)
        );

        await domainEventStore.storeSnapshot({ snapshot });

        const response = {};

        responseBodyParser.parse(
          response,
          { valueName: 'responseBody' }
        ).unwrapOrThrow();

        res.status(200).json(response);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError({ cause: ex as Error });

        switch (error.code) {
          case errors.ContentTypeMismatch.code: {
            res.status(415).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.SnapshotMalformed.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'writeDomainEventStore', { error })
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

export { storeSnapshot };

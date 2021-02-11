import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getSnapshotSchema } from '../../../../common/schemas/getSnapshotSchema';
import { isCustomError } from 'defekt';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const storeSnapshot = {
  description: 'Stores a snapshot.',
  path: 'store-snapshot',

  request: {
    body: getSnapshotSchema()
  },
  response: {
    statusCodes: [ 200, 400, 415 ],

    body: { type: 'object' } as Schema
  },

  getHandler ({
    domainEventStore
  }: {
    domainEventStore: DomainEventStore;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(storeSnapshot.request.body),
          responseBodySchema = new Value(storeSnapshot.response.body);

    return async function (req, res): Promise<any> {
      try {
        const contentType = typer.parse(req);

        if (contentType.type !== 'application/json') {
          throw new errors.ContentTypeMismatch();
        }
      } catch {
        const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

        res.status(415).json({
          code: ex.code,
          message: ex.message
        });

        return;
      }

      const snapshot = req.body;

      try {
        requestBodySchema.validate(snapshot, { valueName: 'requestBody' });
      } catch (ex: unknown) {
        const error = new errors.SnapshotMalformed((ex as Error).message);

        return res.status(400).json({
          code: error.code,
          message: error.message
        });
      }

      try {
        await domainEventStore.storeSnapshot({ snapshot });

        const response = {};

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        logger.error(
          'An unknown error occured.',
          withLogMetadata('api', 'writeDomainEventStore', { err: ex })
        );

        res.status(500).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { storeSnapshot };

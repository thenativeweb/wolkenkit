import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { getSnapshotSchema } from '../../../../common/schemas/getSnapshotSchema';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { CustomError, isCustomError } from 'defekt';

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
      let contentType: typer.ParsedMediaType;

      try {
        contentType = typer.parse(req);
      } catch {
        const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

        return res.status(415).json({
          code: ex.code,
          message: ex.message
        });
      }

      if (contentType.type !== 'application/json') {
        const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

        return res.status(415).json({
          code: ex.code,
          message: ex.message
        });
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
        let error: CustomError;

        if (isCustomError(ex)) {
          error = ex;
        } else {
          error = new errors.UnknownError(undefined, { cause: ex as Error });
        }

        return res.status(400).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { storeSnapshot };

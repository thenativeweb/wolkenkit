import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { errors } from '../../../../common/errors';
import { executeQueryHandler } from '../../../../common/domain/executeQueryHandler';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { QueryHandlerIdentifier } from '../../../../common/elements/QueryHandlerIdentifier';
import { Schema } from '../../../../common/elements/Schema';
import { validateQueryHandlerIdentifier } from '../../../../common/validators/validateQueryHandlerIdentifier';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';
import { CustomError, isCustomError } from 'defekt';

const logger = flaschenpost.getLogger();

const query = {
  description: 'Queries a view.',
  path: ':viewName/:queryName',

  request: {
    query: {
      type: 'object',
      properties: {},
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 403, 404, 415 ]
  },

  getHandler ({ application }: {
    application: Application;
  }): WolkenkitRequestHandler {
    return async function (req, res): Promise<void> {
      const queryHandlerIdentifier: QueryHandlerIdentifier = {
        view: { name: req.params.viewName },
        name: req.params.queryName
      };

      try {
        validateQueryHandlerIdentifier({ application, queryHandlerIdentifier });
      } catch (ex: unknown) {
        let error: CustomError;

        if (isCustomError(ex)) {
          error = ex;
        } else {
          error = new errors.UnknownError(undefined, { cause: ex as Error });
        }

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      let resultStream;

      try {
        resultStream = await executeQueryHandler({
          application,
          queryHandlerIdentifier,
          options: req.query,
          services: {
            client: getClientService({ clientMetadata: new ClientMetadata({ req }) })
          }
        });
      } catch (ex: unknown) {
        let error: CustomError;

        if (isCustomError(ex)) {
          error = ex;
        } else {
          error = new errors.UnknownError(undefined, { cause: ex as Error });
        }

        switch (error.code) {
          case errors.QueryOptionsInvalid.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });
            break;
          }
          case errors.QueryResultInvalid.code: {
            logger.error('An invalid query result was caught.', { ex: error });

            res.status(500).json({
              code: error.code
            });
            break;
          }
          default: {
            logger.error('An unknown error occured.', { ex });

            res.status(500).json({
              code: error.code
            });
          }
        }

        return;
      }

      res.startStream({ heartbeatInterval: false });

      for await (const resultItem of resultStream) {
        writeLine({ res, data: resultItem });
      }

      res.end();
    };
  }
};

export { query };

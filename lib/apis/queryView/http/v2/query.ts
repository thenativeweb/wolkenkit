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
      } catch (ex) {
        res.status(400).json({
          code: ex.code,
          message: ex.message
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
      } catch (ex) {
        switch (ex.code) {
          case errors.QueryOptionsInvalid.code: {
            res.status(400).json({
              code: ex.code,
              message: ex.message
            });
            break;
          }
          case errors.QueryResultInvalid.code: {
            logger.error('An invalid query result was caught.', { ex });

            res.status(500).json({
              code: ex.code
            });
            break;
          }
          default: {
            logger.error('Unknown error occured.', { ex });

            res.status(500).json({
              code: ex.code ?? errors.UnknownError.code
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

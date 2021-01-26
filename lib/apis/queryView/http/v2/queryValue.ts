import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { errors } from '../../../../common/errors';
import { executeValueQueryHandler } from '../../../../common/domain/executeValueQueryHandler';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { isCustomError } from 'defekt';
import { QueryHandlerIdentifier } from '../../../../common/elements/QueryHandlerIdentifier';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { validateQueryHandlerIdentifier } from '../../../../common/validators/validateQueryHandlerIdentifier';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const queryValue = {
  description: 'Queries a view and returns a value.',
  path: ':viewName/value/:queryName',

  request: {
    query: {
      type: 'object',
      properties: {},
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 404 ]
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
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      try {
        const queryResultItem = await executeValueQueryHandler({
          application,
          queryHandlerIdentifier,
          options: req.query,
          services: {
            client: getClientService({ clientMetadata: new ClientMetadata({ req }) })
          }
        });

        res.status(200).json(queryResultItem);

        return;
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
          case errors.QueryOptionsInvalid.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });
            break;
          }
          case errors.QueryHandlerTypeMismatch.code: {
            res.status(400).json({
              code: error.code,
              message: 'Can not query for a stream on a value query handler.'
            });
            break;
          }
          case errors.QueryResultInvalid.code: {
            logger.error('An invalid query result was caught.', { ex: error });

            res.status(404).json({
              code: errors.NotFound.code
            });
            break;
          }
          case errors.QueryNotAuthorized.code: {
            res.status(404).json({
              code: errors.NotFound.code
            });
            break;
          }
          case errors.NotFound.code: {
            res.status(404).json({
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
      }
    };
  }
};

export { queryValue };

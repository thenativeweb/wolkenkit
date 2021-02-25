import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { errors } from '../../../../common/errors';
import { executeStreamQueryHandler } from '../../../../common/domain/executeStreamQueryHandler';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { isCustomError } from 'defekt';
import { QueryHandlerIdentifier } from '../../../../common/elements/QueryHandlerIdentifier';
import { Schema } from '../../../../common/elements/Schema';
import { validateQueryHandlerIdentifier } from '../../../../common/validators/validateQueryHandlerIdentifier';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';

const logger = flaschenpost.getLogger();

const queryStream = {
  description: 'Queries a view and returns a stream.',
  path: ':viewName/stream/:queryName',

  request: {
    query: {
      type: 'object',
      properties: {},
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400 ]
  },

  getHandler ({ application }: {
    application: Application;
  }): WolkenkitRequestHandler {
    return async function (req, res): Promise<void> {
      try {
        const queryHandlerIdentifier: QueryHandlerIdentifier = {
          view: { name: req.params.viewName },
          name: req.params.queryName
        };

        validateQueryHandlerIdentifier({ application, queryHandlerIdentifier });

        const resultStream = await executeStreamQueryHandler({
          application,
          queryHandlerIdentifier,
          options: req.query,
          services: {
            client: getClientService({ clientMetadata: new ClientMetadata({ req }) })
          }
        });

        try {
          res.startStream({ heartbeatInterval: false });

          for await (const resultItem of resultStream) {
            writeLine({ res, data: resultItem });
          }
        } catch (ex: unknown) {
          logger.error(
            'An unknown error occured.',
            withLogMetadata('api', 'queryView', { error: ex })
          );
        } finally {
          res.end();
        }
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
          case errors.ViewNotFound.code:
          case errors.QueryHandlerNotFound.code:
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
            logger.error(
              'An invalid query result was occured.',
              withLogMetadata('api', 'queryView', { error })
            );

            res.status(500).json({
              code: error.code
            });
            break;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'queryView', { error })
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

export { queryStream };

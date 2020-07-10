import { Application } from '../../../../common/application/Application';
import { flaschenpost } from 'flaschenpost';
import { pipeline } from 'stream';
import { QueryHandlerIdentifier } from '../../../../common/elements/QueryHandlerIdentifier';
import { validateQueryHandlerIdentifier } from '../../../../common/validators/validateQueryHandlerIdentifier';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const query = {
  description: 'Queries a view.',
  path: ':viewName/:queryName',

  request: {
    query: {
      type: 'object',
      properties: {
      },
      additionalProperties: false
    }
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

      let result;

      try {
        result = await executeQueryHandler({
          application,
          queryHandlerIdentifier,
          options: req.query
        });
      } catch (ex) {
        switch (ex.code) {
          default: {
            logger.error('Unknown error occured.', { ex });

            res.status(500).json({
              code: ex.code ?? 'EUNKNOWNERROR',
              message: ex.message
            });
          }
        }

        return;
      }

      pipeline(
        result,
        res,
        (err): void => {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error('An error occured during stream piping.', { err });
        }
      );
    };
  }
};

export { query };

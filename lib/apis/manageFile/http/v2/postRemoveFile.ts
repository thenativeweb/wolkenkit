import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { getErrorService } from '../../../../common/services/getErrorService';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { isCustomError } from 'defekt';
import { Parser } from 'validate-value';
import { Schema } from '../../../../common/elements/Schema';
import { validateContentType } from '../../../base/validateContentType';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const postRemoveFile = {
  description: 'Removes a file.',
  path: 'remove-file',

  request: {
    body: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' }
      },
      required: [ 'id' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 401, 404, 415, 500 ],
    body: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    } as Schema
  },

  getHandler ({ application, fileStore }: {
    application: Application;
    fileStore: FileStore;
  }): WolkenkitRequestHandler {
    const requestBodyParser = new Parser(postRemoveFile.request.body),
          responseBodyParser = new Parser(postRemoveFile.response.body);

    return async function (req, res): Promise<any> {
      try {
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

        requestBodyParser.parse(
          req.body,
          { valueName: 'requestBody' }
        ).unwrapOrThrow(
          (err): Error => new errors.RequestMalformed(err.message)
        );

        const { id } = req.body;

        const clientService = getClientService({ clientMetadata: new ClientMetadata({ req }) });
        const fileMetadata = await fileStore.getMetadata({ id });

        if (application.hooks.removingFile) {
          const errorService = getErrorService({ errors: [ 'NotAuthenticated' ]});

          await application.hooks.removingFile(fileMetadata, {
            client: clientService,
            error: errorService,
            infrastructure: application.infrastructure,
            logger: getLoggerService({
              fileName: '<app>/server/hooks/removingFile',
              packageManifest: application.packageManifest
            })
          });
        }

        await fileStore.removeFile({ id });

        if (application.hooks.removedFile) {
          await application.hooks.removedFile(fileMetadata, {
            client: clientService,
            infrastructure: application.infrastructure,
            logger: getLoggerService({
              fileName: '<app>/server/hooks/removedFile',
              packageManifest: application.packageManifest
            })
          });
        }

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
          case errors.RequestMalformed.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.NotAuthenticated.code: {
            res.status(401).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.FileNotFound.code: {
            res.status(404).json({
              code: error.code,
              message: error.message
            });
            break;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'manageFile', { error })
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

export { postRemoveFile };

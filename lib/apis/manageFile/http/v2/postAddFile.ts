import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { errors } from '../../../../common/errors';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { getErrorService } from '../../../../common/services/getErrorService';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { isCustomError } from 'defekt';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const contentTypeRegex = /^\w+\/[-.\w]+(?:\+[-.\w]+)?$/u;

// eslint-disable-next-line @typescript-eslint/no-base-to-string
const contentTypeRegexAsString = contentTypeRegex.toString().slice(1, -2);

const postAddFile = {
  description: 'Adds a file.',
  path: 'add-file',

  request: {
    headers: {
      type: 'object',
      properties: {
        'x-id': { type: 'string', format: 'uuid' },
        'x-name': { type: 'string', minLength: 1 },
        'content-type': { type: 'string', pattern: contentTypeRegexAsString }
      },
      required: [],
      additionalProperties: true
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 401, 409, 500 ],
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
    const requestHeadersSchema = new Value(postAddFile.request.headers),
          responseBodySchema = new Value(postAddFile.response.body);

    return async function (req, res): Promise<any> {
      try {
        try {
          requestHeadersSchema.validate(req.headers, { valueName: 'requestHeaders' });
        } catch (ex: unknown) {
          throw new errors.RequestMalformed((ex as Error).message);
        }

        const clientService = getClientService({ clientMetadata: new ClientMetadata({ req }) });
        let fileAddMetadata = {
          id: req.headers['x-id'] as string,
          name: req.headers['x-name'] as string,
          contentType: req.headers['content-type']!
        };

        if (application.hooks.addingFile) {
          const errorService = getErrorService({ errors: [ 'NotAuthenticated' ]});

          fileAddMetadata = {
            ...fileAddMetadata,
            ...await application.hooks.addingFile(fileAddMetadata, {
              client: clientService,
              error: errorService,
              infrastructure: application.infrastructure,
              logger: getLoggerService({
                fileName: '<app>/server/hooks/addingFile',
                packageManifest: application.packageManifest
              })
            })
          };
        }

        const fileMetadata = await fileStore.addFile({
          ...fileAddMetadata,
          stream: req
        });

        if (application.hooks.addedFile) {
          await application.hooks.addedFile(fileMetadata, {
            client: clientService,
            infrastructure: application.infrastructure,
            logger: getLoggerService({
              fileName: '<app>/server/hooks/addedFile',
              packageManifest: application.packageManifest
            })
          });
        }

        const response = {};

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
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
          case errors.FileAlreadyExists.code: {
            res.status(409).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'manageFile', { err: error })
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

export { postAddFile };

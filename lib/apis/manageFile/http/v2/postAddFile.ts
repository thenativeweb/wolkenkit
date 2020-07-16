import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { errors } from '../../../../common/errors';
import { FileAddMetadata } from '../../../../stores/fileStore/FileAddMetadata';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { getErrorService } from '../../../../common/services/getErrorService';
import { getFileAddMetadataSchema } from '../../../../common/schemas/getFileAddMetadataSchema';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postAddFile = {
  description: 'Adds a file.',
  path: 'add-file',

  request: {},
  response: {
    statusCodes: [ 200, 400, 401, 409, 500 ],
    body: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    }
  },

  getHandler ({ application, fileStore }: {
    application: Application;
    fileStore: FileStore;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(postAddFile.response.body);

    return async function (req, res): Promise<any> {
      if (!req.token || !req.user) {
        const ex = new errors.NotAuthenticated('Client information missing in request.');

        res.status(401).json({ code: ex.code, message: ex.message });

        throw ex;
      }

      const fileAddMetadataCandidate = {
        id: req.headers['x-id'],
        name: req.headers['x-name'],
        contentType: req.headers['content-type']
      };

      try {
        new Value(getFileAddMetadataSchema()).validate(fileAddMetadataCandidate);
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

        res.status(400).json({ code: error.code, message: error.message });

        return;
      }

      try {
        const clientService = getClientService({ clientMetadata: new ClientMetadata({ req }) });
        let fileAddMetadata = fileAddMetadataCandidate as FileAddMetadata;

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
          stream: req.body
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

        responseBodySchema.validate(response);

        res.status(200).json(response);
      } catch (ex) {
        switch (ex.code) {
          case errors.NotAuthenticated.code: {
            res.status(401).json({ code: ex.code, message: ex.message });
            break;
          }
          case errors.FileAlreadyExists.code: {
            res.status(409).json({ code: ex.code, message: ex.message });
            break;
          }
          default: {
            logger.error('An unknown error occured.', { ex });

            const error = new errors.UnknownError(ex.message);

            res.status(500).json({ code: error.code, message: error.message });
          }
        }
      }
    };
  }
};

export { postAddFile };

import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { errors } from '../../../../common/errors';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { getErrorService } from '../../../../common/services/getErrorService';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { jsonSchema } from 'uuidv4';
import { Schema } from '../../../../common/elements/Schema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postRemoveFile = {
  description: 'Removes a file.',
  path: 'remove-file',

  request: {
    body: {
      type: 'object',
      properties: {
        id: jsonSchema.v4
      },
      required: [ 'id' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 401, 404, 500 ],
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
    const requestBodySchema = new Value(postRemoveFile.request.body),
          responseBodySchema = new Value(postRemoveFile.response.body);

    return async function (req, res): Promise<any> {
      if (!req.token || !req.user) {
        const ex = new errors.NotAuthenticated('Client information missing in request.');

        res.status(401).json({ code: ex.code, message: ex.message });

        throw ex;
      }

      try {
        new Value(requestBodySchema).validate(req.body);
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

        res.status(400).json({ code: error.code, message: error.message });

        return;
      }

      try {
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

        responseBodySchema.validate(response);

        res.status(200).json(response);
      } catch (ex) {
        switch (ex.code) {
          case errors.NotAuthenticated.code: {
            res.status(401).json({ code: ex.code, message: ex.message });
            break;
          }
          case errors.FileNotFound.code: {
            res.status(404).json({ code: ex.code, message: ex.message });
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

export { postRemoveFile };

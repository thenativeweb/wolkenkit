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
import typer from 'content-type';
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
    const requestBodySchema = new Value(postRemoveFile.request.body),
          responseBodySchema = new Value(postRemoveFile.response.body);

    return async function (req, res): Promise<any> {
      if (!req.token || !req.user) {
        const ex = new errors.NotAuthenticated('Client information missing in request.');

        res.status(401).json({ code: ex.code, message: ex.message });

        throw ex;
      }

      try {
        const contentType = typer.parse(req);

        if (contentType.type !== 'application/json') {
          throw new errors.RequestMalformed();
        }
      } catch {
        const ex = new errors.RequestMalformed('Header content-type must be application/json.');

        res.status(415).json({ code: ex.code, message: ex.message });

        return;
      }

      try {
        requestBodySchema.validate(req.body, { valueName: 'requestBody' });
      } catch (ex: unknown) {
        const error = new errors.RequestMalformed((ex as Error).message);

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

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
          case errors.NotAuthenticated.code: {
            res.status(401).json({ code: error.code, message: error.message });
            break;
          }
          case errors.FileNotFound.code: {
            res.status(404).json({ code: error.code, message: error.message });
            break;
          }
          default: {
            logger.error('An unknown error occured.', { ex: error });

            res.status(500).json({ code: error.code, message: error.message });
          }
        }
      }
    };
  }
};

export { postRemoveFile };

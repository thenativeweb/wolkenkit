import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { errors } from '../../../../common/errors';
import { FileMetadata } from '../../../../stores/fileStore/FileMetadata';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { getErrorService } from '../../../../common/services/getErrorService';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { isCustomError } from 'defekt';
import { pipeline as pipelineCallback } from 'stream';
import { promisify } from 'util';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const pipeline = promisify(pipelineCallback);
const logger = flaschenpost.getLogger();

const getFile = {
  description: 'Returns the requested file.',
  path: 'file/:id',

  request: {},
  response: {
    statusCodes: [ 200, 400, 401, 404, 500 ],
    stream: true
  },

  getHandler ({ application, fileStore }: {
    application: Application;
    fileStore: FileStore;
  }): WolkenkitRequestHandler {
    return async function (req, res): Promise<any> {
      const { id } = req.params;

      try {
        new Value({
          type: 'string',
          format: 'uuid'
        }).validate(id, { valueName: 'uuid' });
      } catch (ex: unknown) {
        const error = new errors.RequestMalformed((ex as Error).message);

        res.status(400).json({ code: error.code, message: error.message });

        return;
      }

      const clientService = getClientService({ clientMetadata: new ClientMetadata({ req }) });
      let fileMetadata: FileMetadata;

      try {
        fileMetadata = await fileStore.getMetadata({ id });

        if (application.hooks.gettingFile) {
          const errorService = getErrorService({ errors: [ 'NotAuthenticated' ]});

          await application.hooks.gettingFile(fileMetadata, {
            client: clientService,
            error: errorService,
            infrastructure: application.infrastructure,
            logger: getLoggerService({
              fileName: '<app>/server/hooks/gettingFile',
              packageManifest: application.packageManifest
            })
          });
        }

        const stream = await fileStore.getFile({ id });

        res.set('x-id', fileMetadata.id);
        res.set('x-name', fileMetadata.name);
        res.set('content-type', fileMetadata.contentType);
        res.set('content-length', String(fileMetadata.contentLength));
        res.set('content-disposition', `inline; filename=${fileMetadata.name}`);

        await pipeline(stream, res);
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
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'manageFile', { err: error })
            );

            res.status(500).json({ code: error.code, message: error.message });
          }
        }

        return;
      }

      try {
        if (application.hooks.gotFile) {
          await application.hooks.gotFile(fileMetadata, {
            client: clientService,
            infrastructure: application.infrastructure,
            logger: getLoggerService({
              fileName: '<app>/server/hooks/gotFile',
              packageManifest: application.packageManifest
            })
          });
        }
      } catch (ex: unknown) {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api', 'manageFile', { err: ex })
        );
      }
    };
  }
};

export { getFile };

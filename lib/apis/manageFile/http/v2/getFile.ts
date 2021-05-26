import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { getErrorService } from '../../../../common/services/getErrorService';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { isCustomError } from 'defekt';
import { Parser } from 'validate-value';
import { pipeline as pipelineCallback } from 'stream';
import { promisify } from 'util';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

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
    const uuidParser = new Parser({ type: 'string', format: 'uuid' });

    return async function (req, res): Promise<any> {
      try {
        const { id } = req.params;

        uuidParser.parse(id, { valueName: 'uuid' }).unwrapOrThrow(
          (err): Error => new errors.RequestMalformed(err.message)
        );

        const clientService = getClientService({ clientMetadata: new ClientMetadata({ req }) });
        const fileMetadata = await fileStore.getMetadata({ id });

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
            withLogMetadata('api', 'manageFile', { error: ex })
          );
        }
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError({ cause: ex as Error });

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
          case errors.FileNotFound.code: {
            res.status(404).json({
              code: error.code,
              message: error.message
            });

            return;
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

export { getFile };

import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { hasAccess } from './isAuthorized';
import { pipeline as pipelineCallback } from 'stream';
import { promisify } from 'util';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const pipeline = promisify(pipelineCallback);
const logger = flaschenpost.getLogger();

const getFile = {
  description: 'Returns the requested file.',
  path: 'file/:id',

  request: {},
  response: {
    statusCodes: [ 200, 401, 404 ],
    stream: true
  },

  getHandler ({ fileStore }: { fileStore: FileStore }): WolkenkitRequestHandler {
    return async function (req, res): Promise<any> {
      const { id } = req.params;
      const { user } = req;

      try {
        const { fileName, contentType, contentLength, isAuthorized } = await fileStore.getMetadata({ id });

        if (!hasAccess({ user, to: 'queries.getFile', authorizationOptions: isAuthorized })) {
          return res.status(401).end();
        }

        const stream = await fileStore.getFile({ id });

        res.set('content-type', contentType);
        res.set('content-length', String(contentLength));
        res.set('content-disposition', `inline; filename=${fileName}`);
        res.set('x-metadata', JSON.stringify({ id, fileName, contentType, contentLength }));

        await pipeline(stream, res);
      } catch (ex) {
        logger.error('Failed to get file.', { id, err: ex });

        if (ex.code === 'EFILENOTFOUND') {
          return res.status(404).end();
        }

        res.status(500).end();
      }
    };
  }
};

export { getFile };

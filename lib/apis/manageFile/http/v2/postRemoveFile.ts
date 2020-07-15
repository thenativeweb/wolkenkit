import { errors } from '../../../../common/errors';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postRemoveFile = {
  description: 'Removes a file.',
  path: 'remove-file',

  request: {},
  response: {
    statusCodes: [ 200, 400, 401, 404 ]
  },

  getHandler: ({ fileStore }: {
    fileStore: FileStore;
  }): WolkenkitRequestHandler => async function (req, res): Promise<any> {
    let metadata;

    try {
      metadata = JSON.parse(req.headers['x-metadata'] as string);
    } catch {
      return res.status(400).send('Header x-metadata is malformed.');
    }

    const { id } = metadata;

    if (!id) {
      return res.status(400).send('Id is missing.');
    }

    try {
      await fileStore.removeFile({ id });

      res.status(200).end();
    } catch (ex) {
      logger.error('Failed to remove file.', { id, err: ex });

      if (ex.code === errors.FileNotFound.code) {
        return res.status(404).end();
      }

      res.status(500).end();
    }
  }
};

export { postRemoveFile };

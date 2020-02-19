import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { hasAccess } from './isAuthorized';
import { RequestHandler } from 'express';

const logger = flaschenpost.getLogger();

const postRemoveFile = ({ fileStore }: {
  fileStore: FileStore;
}): RequestHandler => async function (req, res): Promise<any> {
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

  const { user } = req;

  try {
    const { isAuthorized } = await fileStore.getMetadata({ id });

    if (!hasAccess({ user, to: 'commands.removeFile', authorizationOptions: isAuthorized })) {
      return res.status(401).end();
    }

    await fileStore.removeFile({ id });

    res.status(200).end();
  } catch (ex) {
    logger.error('Failed to remove file.', { id, err: ex });

    if (ex.code === 'EFILENOTFOUND') {
      return res.status(404).end();
    }

    res.status(500).end();
  }
};

export { postRemoveFile };

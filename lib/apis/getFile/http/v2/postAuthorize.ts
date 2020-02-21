import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { merge } from 'lodash';
import { RequestHandler } from 'express';
import { hasAccess, isValid } from './isAuthorized';

const logger = flaschenpost.getLogger();

const postAuthorize = ({ fileStore }: {
  fileStore: FileStore;
}): RequestHandler => async function (req, res): Promise<any> {
  let metadata;

  try {
    metadata = JSON.parse(req.headers['x-metadata'] as string);
  } catch {
    return res.status(400).send('Header x-metadata is malformed.');
  }

  if (!metadata.id) {
    return res.status(400).send('Id is missing.');
  }
  if (!metadata.isAuthorized) {
    return res.status(400).send('Is authorized is missing.');
  }

  const { id } = metadata;
  const { user } = req;

  try {
    const { isAuthorized } = await fileStore.getMetadata({ id });

    if (!hasAccess({ user, to: 'commands.authorize', authorizationOptions: isAuthorized })) {
      return res.status(401).end();
    }

    const newIsAuthorized = merge({}, isAuthorized, metadata.isAuthorized, { owner: isAuthorized.owner });

    if (!isValid(newIsAuthorized)) {
      return res.status(400).send('Is authorized is malformed.');
    }

    await fileStore.authorize({ id, isAuthorized: newIsAuthorized });

    res.status(200).end();
  } catch (ex) {
    logger.error('Failed to authorize.', { id, err: ex });

    if (ex.code === 'EFILENOTFOUND') {
      return res.status(404).end();
    }

    res.status(500).end();
  }
};

export { postAuthorize };

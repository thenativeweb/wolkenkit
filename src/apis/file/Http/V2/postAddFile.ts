import errors from '../../../../../build/src/common/errors';
import { Filestore } from '../../../../stores/filestore/Filestore';
import flaschenpost from 'flaschenpost';
import merge from 'lodash/merge';
import { RequestHandler } from 'express-serve-static-core';
import { SpecificAuthorizationOption } from './isAuthorized/AuthorizationOptions';
import uuid from 'uuidv4';
import { getDefaults, hasAccess, isValid } from './isAuthorized';

const logger = flaschenpost.getLogger();

const postAddFile = function ({ addFileAuthorizationOptions, filestore }: {
  addFileAuthorizationOptions: SpecificAuthorizationOption;
  filestore: Filestore;
}): RequestHandler {
  const rawAuthorizationOptions = merge({}, getDefaults(), {
    commands: {
      addFile: addFileAuthorizationOptions
    }
  });

  return async function (req, res): Promise<any> {
    const { user } = req;

    if (!user) {
      throw new errors.InvalidOperation();
    }

    const owner = user.id;
    const authorizationOptions = merge({}, rawAuthorizationOptions, {
      owner
    });

    if (!hasAccess({ user, to: 'commands.addFile', authorizationOptions, isConstructor: true })) {
      return res.status(401).end();
    }

    let metadata;

    try {
      metadata = JSON.parse(req.headers['x-metadata'] as string);
    } catch {
      return res.status(400).send('Header x-metadata is malformed.');
    }

    const {
      id,
      fileName,
      contentType = 'application/octet-stream'
    } = metadata;

    if (!id) {
      return res.status(400).send('Id is missing.');
    }
    if (!uuid.is(id)) {
      return res.status(400).send('Id is malformed.');
    }
    if (!fileName) {
      return res.status(400).send('File name is missing.');
    }

    const isAuthorized = merge({}, getDefaults(), metadata.isAuthorized || {}, { owner });

    if (!isValid(isAuthorized)) {
      return res.status(400).send('Is authorized is malformed.');
    }

    try {
      await filestore.addFile({ id, fileName, contentType, isAuthorized, stream: req });

      res.status(200).end();
    } catch (ex) {
      logger.error('Failed to add file.', { err: ex });

      if (ex.code === 'EFILEALREADYEXISTS') {
        return res.status(409).end();
      }

      res.status(500).end();
    }
  };
};

export default postAddFile;

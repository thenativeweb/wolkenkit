'use strict';

const flaschenpost = require('flaschenpost'),
      merge = require('lodash/merge'),
      uuid = require('uuidv4');

const { hasAccess, getDefaults, isValid } = require('./isAuthorized');

const logger = flaschenpost.getLogger();

const postAddFile = function ({ addFileAuthorizationOptions, provider }) {
  if (!addFileAuthorizationOptions) {
    throw new Error('Add file authorization options are missing.');
  }
  if (!provider) {
    throw new Error('Provider is missing.');
  }

  const authorizationOptions = {
    commands: {
      addFile: addFileAuthorizationOptions
    }
  };

  return async function (req, res) {
    const { user } = req;

    if (!hasAccess({ user, to: 'commands.addFile', authorizationOptions, isConstructor: true })) {
      return res.status(401).end();
    }

    let metadata;

    try {
      metadata = JSON.parse(req.headers['x-metadata']);
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

    const isAuthorized = merge({}, getDefaults(), metadata.isAuthorized || {});

    isAuthorized.owner = req.user.sub;

    if (!isValid(isAuthorized)) {
      return res.status(400).send('Is authorized is malformed.');
    }

    try {
      await provider.addFile({ id, fileName, contentType, isAuthorized, stream: req });

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

module.exports = postAddFile;

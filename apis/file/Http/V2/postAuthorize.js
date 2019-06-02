'use strict';

const flaschenpost = require('flaschenpost'),
      merge = require('lodash/merge');

const { hasAccess, isValid } = require('./isAuthorized');

const logger = flaschenpost.getLogger();

const postAuthorize = function ({ provider }) {
  if (!provider) {
    throw new Error('Provider is missing.');
  }

  return async function (req, res) {
    let metadata;

    try {
      metadata = JSON.parse(req.headers['x-metadata']);
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
      const { isAuthorized } = await provider.getMetadata({ id });

      if (!hasAccess({ user, to: 'commands.authorize', authorizationOptions: isAuthorized })) {
        return res.status(401).end();
      }

      const newIsAuthorized = merge({}, isAuthorized, metadata.isAuthorized, { owner: isAuthorized.owner });

      if (!isValid(newIsAuthorized)) {
        return res.status(400).send('Is authorized is malformed.');
      }

      await provider.authorize({ id, isAuthorized: newIsAuthorized });

      res.status(200).end();
    } catch (ex) {
      logger.error('Failed to authorize.', { id, err: ex });

      if (ex.code === 'EFILENOTFOUND') {
        return res.status(404).end();
      }

      res.status(500).end();
    }
  };
};

module.exports = postAuthorize;

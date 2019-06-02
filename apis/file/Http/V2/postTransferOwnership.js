'use strict';

const flaschenpost = require('flaschenpost');

const { hasAccess } = require('./isAuthorized');

const logger = flaschenpost.getLogger();

const postTransferOwnership = function ({ provider }) {
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

    const { id } = metadata;

    if (!id) {
      return res.status(400).send('Id is missing.');
    }

    const to = req.headers['x-to'];

    if (!to) {
      return res.status(400).send('To is missing.');
    }

    const { user } = req;

    try {
      const { isAuthorized } = await provider.getMetadata({ id });

      if (!hasAccess({ user, to: 'commands.transferOwnership', authorizationOptions: isAuthorized })) {
        return res.status(401).end();
      }

      await provider.transferOwnership({ id, to });

      res.status(200).end();
    } catch (ex) {
      logger.error('Failed to transfer ownership.', { id, err: ex });

      if (ex.code === 'EFILENOTFOUND') {
        return res.status(404).end();
      }

      res.status(500).end();
    }
  };
};

module.exports = postTransferOwnership;

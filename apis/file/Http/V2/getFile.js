'use strict';

const { promisify } = require('util');

const flaschenpost = require('flaschenpost'),
      pumpCallback = require('pump');

const { hasAccess } = require('./isAuthorized');

const pump = promisify(pumpCallback);

const logger = flaschenpost.getLogger();

const getFile = function ({ provider }) {
  if (!provider) {
    throw new Error('Provider is missing.');
  }

  return async function (req, res) {
    const { id } = req.params;
    const { user } = req;

    try {
      const { fileName, contentType, contentLength, isAuthorized } = await provider.getMetadata({ id });

      if (!hasAccess({ user, to: 'queries.getFile', authorizationOptions: isAuthorized })) {
        return res.status(401).end();
      }

      const stream = await provider.getFile({ id });

      res.set('content-type', contentType);
      res.set('content-length', contentLength);
      res.set('content-disposition', `inline; filename=${fileName}`);
      res.set('x-metadata', JSON.stringify({ id, fileName, contentType, contentLength }));

      await pump(stream, res);
    } catch (ex) {
      logger.error('Failed to get file.', { id, err: ex });

      if (ex.code === 'EFILENOTFOUND') {
        return res.status(404).end();
      }

      res.status(500).end();
    }
  };
};

module.exports = getFile;

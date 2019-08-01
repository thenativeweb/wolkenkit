'use strict';

const axios = require('axios'),
      retry = require('async-retry');

const errors = require('../../common/errors');

const sendCommand = async function ({
  command,
  protocol,
  hostname,
  port,
  pathname,
  retries
}) {
  if (!command) {
    throw new Error('Command is missing.');
  }
  if (!protocol) {
    throw new Error('Protocol is missing.');
  }
  if (!hostname) {
    throw new Error('Hostname is missing.');
  }
  if (!port) {
    throw new Error('Port is missing.');
  }
  if (!pathname) {
    throw new Error('Pathname is missing.');
  }
  if (retries === undefined) {
    throw new Error('Retries is missing.');
  }

  try {
    await retry(async () => {
      await axios({
        method: 'post',
        url: `${protocol}://${hostname}:${port}${pathname}`,
        data: command
      });
    }, {
      retries,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: Number.POSITIVE_INFINITY,
      randomize: false
    });
  } catch (ex) {
    throw new errors.RequestFailed(ex.message);
  }
};

module.exports = sendCommand;

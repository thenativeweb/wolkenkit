'use strict';

const crypto = require('crypto');

const promisify = require('util.promisify'),
      sha1 = require('sha1');

const randomBytes = promisify(crypto.randomBytes);

const generateSecret = async function () {
  const bytes = await randomBytes(64),
        hex = bytes.toString('hex');

  const secret = sha1(hex);

  return secret;
};

module.exports = generateSecret;

'use strict';

const crypto = require('crypto');

const promisify = require('util.promisify'),
      sha1 = require('sha1');

const randomBytes = promisify(crypto.randomBytes);

const generateSharedKey = async function () {
  const bytes = await randomBytes(64),
        hex = bytes.toString('hex');

  const sharedKey = sha1(hex);

  return sharedKey;
};

module.exports = generateSharedKey;

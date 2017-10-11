'use strict';

const isIp = require('is-ip');

const ip = {
  is (text) {
    return isIp(text);
  },

  isV4 (text) {
    return isIp.v4(text);
  },

  isV6 (text) {
    return isIp.v6(text);
  },

  getFamily (text) {
    if (!isIp(text)) {
      throw new Error('Invalid IP address.');
    }

    if (isIp.v4(text)) {
      return 4;
    }
    if (isIp.v6(text)) {
      return 6;
    }

    throw new Error('Unknown family.');
  }
};

module.exports = ip;

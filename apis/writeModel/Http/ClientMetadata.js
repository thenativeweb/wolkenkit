'use strict';

class ClientMetadata {
  constructor ({ req }) {
    if (!req) {
      throw new Error('Request is missing.');
    }
    if (!req.user) {
      throw new Error('User is missing.');
    }
    if (!req.user.sub) {
      throw new Error('Sub is missing.');
    }
    if (!req.connection.remoteAddress) {
      throw new Error('Remote address is missing.');
    }

    this.user = { id: req.user.sub, token: req.user };
    this.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
}

module.exports = ClientMetadata;

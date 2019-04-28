'use strict';

class ClientMetadata {
  constructor ({ req }) {
    if (!req) {
      throw new Error('Request is missing.');
    }

    this.user = { id: req.user.sub, token: req.user };
    this.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
}

module.exports = ClientMetadata;

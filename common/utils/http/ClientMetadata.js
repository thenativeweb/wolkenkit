'use strict';

class ClientMetadata {
  constructor ({ req }) {
    if (!req) {
      throw new Error('Request is missing.');
    }
    if (!req.token) {
      throw new Error('Token is missing.');
    }
    if (!req.user) {
      throw new Error('User is missing.');
    }
    if (!req.user.id) {
      throw new Error('User id is missing.');
    }
    if (!req.user.claims) {
      throw new Error('User claims are missing.');
    }
    if (!req.connection) {
      throw new Error('Connection is missing.');
    }
    if (!req.connection.remoteAddress) {
      throw new Error('Remote address is missing.');
    }
    if (!req.headers) {
      throw new Error('Headers are missing.');
    }

    this.token = req.token;
    this.user = { id: req.user.id, claims: req.user.claims };
    this.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
}

module.exports = ClientMetadata;

'use strict';

class ClientService {
  constructor ({ clientMetadata }) {
    if (!clientMetadata) {
      throw new Error('Client metadata are missing.');
    }

    const { token, user, ip } = clientMetadata;

    if (!token) {
      throw new Error('Token is missing.');
    }
    if (!user) {
      throw new Error('User is missing.');
    }
    if (!user.id) {
      throw new Error('User id is missing.');
    }
    if (!user.claims) {
      throw new Error('User claims are missing.');
    }
    if (!ip) {
      throw new Error('IP is missing.');
    }

    this.token = token;
    this.user = { id: user.id, claims: user.claims };
    this.ip = ip;
  }
}

module.exports = ClientService;

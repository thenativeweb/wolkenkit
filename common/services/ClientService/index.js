'use strict';

class ClientService {
  constructor ({ metadata }) {
    if (!metadata) {
      throw new Error('Metadata are missing.');
    }
    if (!metadata.client) {
      throw new Error('Client is missing.');
    }

    const { user, ip } = metadata.client;

    if (!user) {
      throw new Error('User is missing.');
    }
    if (!user.id) {
      throw new Error('User id is missing.');
    }
    if (!user.token) {
      throw new Error('Token is missing.');
    }
    if (!ip) {
      throw new Error('Ip is missing.');
    }

    this.user = { id: user.id, token: user.token };
    this.ip = ip;
  }
}

module.exports = ClientService;

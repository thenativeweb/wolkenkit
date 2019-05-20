'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { ClientService } = require('../../../../common/services');

suite('ClientService', () => {
  test('is a function.', async () => {
    assert.that(ClientService).is.ofType('function');
  });

  test('throws an error if client metadata are missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({});
      /* eslint-enable no-new */
    }).is.throwing('Client metadata are missing.');
  });

  test('throws an error if token is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({
        clientMetadata: {
          user: { id: uuid(), claims: { sub: uuid() }},
          ip: '127.0.0.1'
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Token is missing.');
  });

  test('throws an error if user is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({
        clientMetadata: {
          token: '...',
          ip: '127.0.0.1'
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('User is missing.');
  });

  test('throws an error if user id is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({
        clientMetadata: {
          token: '...',
          user: { claims: {}},
          ip: '127.0.0.1'
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('User id is missing.');
  });

  test('throws an error if claims are missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({
        clientMetadata: {
          token: '...',
          user: { id: uuid() },
          ip: '127.0.0.1'
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('User claims are missing.');
  });

  test('throws an error if IP is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({
        clientMetadata: {
          token: '...',
          user: { id: uuid(), claims: {}}
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('IP is missing.');
  });

  test('provides the token of the client.', async () => {
    const id = uuid();

    const clientService = new ClientService({
      clientMetadata: {
        token: '...',
        user: { id, claims: {}},
        ip: '127.0.0.1'
      }
    });

    assert.that(clientService.token).is.equalTo('...');
  });

  test('provides the user of the client.', async () => {
    const id = uuid();

    const clientService = new ClientService({
      clientMetadata: {
        token: '...',
        user: { id, claims: { sub: id }},
        ip: '127.0.0.1'
      }
    });

    assert.that(clientService.user).is.equalTo({ id, claims: { sub: id }});
  });

  test('provides the IP of the client.', async () => {
    const id = uuid();

    const clientService = new ClientService({
      clientMetadata: {
        token: '...',
        user: { id, claims: {}},
        ip: '127.0.0.1'
      }
    });

    assert.that(clientService.ip).is.equalTo('127.0.0.1');
  });
});

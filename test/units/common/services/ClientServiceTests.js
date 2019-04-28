'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { ClientService } = require('../../../../common/services');

suite('ClientService', () => {
  test('is a function.', async () => {
    assert.that(ClientService).is.ofType('function');
  });

  test('throws an error if metadata are missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({});
      /* eslint-enable no-new */
    }).is.throwing('Metadata are missing.');
  });

  test('throws an error if client is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({ metadata: {}});
      /* eslint-enable no-new */
    }).is.throwing('Client is missing.');
  });

  test('throws an error if IP is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({
        metadata: {
          client: {
            user: { id: uuid(), token: { sub: uuid() }}
          }
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Ip is missing.');
  });

  test('throws an error if user is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({
        metadata: {
          client: {
            ip: '127.0.0.1'
          }
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('User is missing.');
  });

  test('throws an error if user id is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({
        metadata: {
          client: {
            ip: '127.0.0.1',
            user: { token: { sub: uuid() }}
          }
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('User id is missing.');
  });

  test('throws an error if token is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientService({
        metadata: {
          client: {
            ip: '127.0.0.1',
            user: { id: uuid() }
          }
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Token is missing.');
  });

  test('provides the IP of the client.', async () => {
    const sub = uuid();

    const clientService = new ClientService({
      metadata: {
        client: {
          user: { id: sub, token: { sub }},
          ip: '127.0.0.1'
        }
      }
    });

    assert.that(clientService.ip).is.equalTo('127.0.0.1');
  });

  test('provides the user of the client.', async () => {
    const sub = uuid();

    const clientService = new ClientService({
      metadata: {
        client: {
          user: { id: sub, token: { sub }},
          ip: '127.0.0.1'
        }
      }
    });

    assert.that(clientService.user).is.equalTo({ id: sub, token: { sub }});
  });
});

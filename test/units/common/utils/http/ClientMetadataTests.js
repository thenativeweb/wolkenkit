'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const ClientMetadata = require('../../../../../common/utils/http/ClientMetadata');

suite('ClientMetadata', () => {
  test('is a function.', async () => {
    assert.that(ClientMetadata).is.ofType('function');
  });

  test('throws an error if request is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({});
      /* eslint-enable no-new */
    }).is.throwing('Request is missing.');
  });

  test('throws an error if user is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('User is missing.');
  });

  test('throws an error if sub is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          user: {},
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Sub is missing.');
  });

  test('throws an error if connection is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          user: { sub: uuid() },
          headers: {}
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Connection is missing.');
  });

  test('throws an error if remote address is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          user: { sub: uuid() },
          connection: {},
          headers: {}
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Remote address is missing.');
  });

  test('throws an error if headers are missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          user: { sub: uuid() },
          connection: { remoteAddress: '127.0.0.1' }
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Headers are missing.');
  });

  suite('user', () => {
    test('contains the user.', async () => {
      const sub = uuid();

      const clientMetadata = new ClientMetadata({
        req: {
          user: { sub },
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });

      assert.that(clientMetadata.user).is.equalTo({
        id: sub,
        token: { sub }
      });
    });
  });

  suite('ip', () => {
    test('contains the remote address.', async () => {
      const sub = uuid();

      const clientMetadata = new ClientMetadata({
        req: {
          user: { sub },
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });

      assert.that(clientMetadata.ip).is.equalTo('127.0.0.1');
    });

    test('prefers the x-forwarded-for header if set.', async () => {
      const sub = uuid();

      const clientMetadata = new ClientMetadata({
        req: {
          user: { sub },
          connection: { remoteAddress: '127.0.0.1' },
          headers: { 'x-forwarded-for': '192.168.0.1' }
        }
      });

      assert.that(clientMetadata.ip).is.equalTo('192.168.0.1');
    });
  });
});

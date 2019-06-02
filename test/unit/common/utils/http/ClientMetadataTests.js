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

  test('throws an error if token is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          user: { id: 'jane.doe', claims: {}},
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Token is missing.');
  });

  test('throws an error if user is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          token: '...',
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('User is missing.');
  });

  test('throws an error if user id is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          token: '...',
          user: { claims: {}},
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('User id is missing.');
  });

  test('throws an error if user claims are missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          token: '...',
          user: { id: 'jane.doe' },
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('User claims are missing.');
  });

  test('throws an error if connection is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new ClientMetadata({
        req: {
          token: '...',
          user: { id: uuid(), claims: {}},
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
          token: '...',
          user: { id: uuid(), claims: {}},
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
          token: '...',
          user: { id: uuid(), claims: {}},
          connection: { remoteAddress: '127.0.0.1' }
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Headers are missing.');
  });

  suite('token', () => {
    test('contains the token.', async () => {
      const clientMetadata = new ClientMetadata({
        req: {
          token: '...',
          user: { id: uuid(), claims: {}},
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });

      assert.that(clientMetadata.token).is.equalTo('...');
    });
  });

  suite('user', () => {
    test('contains the user.', async () => {
      const claims = {},
            id = uuid();

      const clientMetadata = new ClientMetadata({
        req: {
          token: '...',
          user: { id, claims },
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });

      assert.that(clientMetadata.user).is.equalTo({ id, claims });
    });
  });

  suite('ip', () => {
    test('contains the remote address.', async () => {
      const clientMetadata = new ClientMetadata({
        req: {
          token: '...',
          user: { id: uuid(), claims: {}},
          connection: { remoteAddress: '127.0.0.1' },
          headers: {}
        }
      });

      assert.that(clientMetadata.ip).is.equalTo('127.0.0.1');
    });

    test('prefers the x-forwarded-for header if set.', async () => {
      const clientMetadata = new ClientMetadata({
        req: {
          token: '...',
          user: { id: uuid(), claims: {}},
          connection: { remoteAddress: '127.0.0.1' },
          headers: { 'x-forwarded-for': '192.168.0.1' }
        }
      });

      assert.that(clientMetadata.ip).is.equalTo('192.168.0.1');
    });
  });
});

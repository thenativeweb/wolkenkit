import assert from 'assertthat';
import uuid from 'uuidv4';

import ClientMetadata from '../../../../../src/common/utils/http/ClientMetadata';

suite('ClientMetadata', () => {
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

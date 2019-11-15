import { assert } from 'assertthat';
import { ClientMetadata } from '../../../../../lib/common/utils/http/ClientMetadata';
import { uuid } from 'uuidv4';

suite('ClientMetadata', (): void => {
  suite('token', (): void => {
    test('contains the token.', async (): Promise<void> => {
      const req = {
        token: '...',
        user: { id: uuid(), claims: {}},
        connection: { remoteAddress: '127.0.0.1' },
        headers: {}
      } as any;

      const clientMetadata = new ClientMetadata({
        req
      });

      assert.that(clientMetadata.token).is.equalTo('...');
    });
  });

  suite('user', (): void => {
    test('contains the user.', async (): Promise<void> => {
      const claims = {},
            id = uuid(),
            req = {
              token: '...',
              user: { id, claims },
              connection: { remoteAddress: '127.0.0.1' },
              headers: {}
            } as any;

      const clientMetadata = new ClientMetadata({
        req
      });

      assert.that(clientMetadata.user).is.equalTo({ id, claims });
    });
  });

  suite('ip', (): void => {
    test('contains the remote address.', async (): Promise<void> => {
      const req = {
        token: '...',
        user: { id: uuid(), claims: {}},
        connection: { remoteAddress: '127.0.0.1' },
        headers: {}
      } as any;

      const clientMetadata = new ClientMetadata({
        req
      });

      assert.that(clientMetadata.ip).is.equalTo('127.0.0.1');
    });

    test('prefers the x-forwarded-for header if set.', async (): Promise<void> => {
      const req = {
        token: '...',
        user: { id: uuid(), claims: {}},
        connection: { remoteAddress: '127.0.0.1' },
        headers: { 'x-forwarded-for': '192.168.0.1' }
      } as any;

      const clientMetadata = new ClientMetadata({
        req
      });

      assert.that(clientMetadata.ip).is.equalTo('192.168.0.1');
    });
  });
});

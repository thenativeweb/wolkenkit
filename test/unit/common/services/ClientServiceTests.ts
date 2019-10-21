import assert from 'assertthat';
import getClientService from '../../../../lib/common/services/getClientService';
import uuid from 'uuidv4';

suite('ClientService', (): void => {
  test('provides the token of the client.', async (): Promise<void> => {
    const id = uuid();

    const clientService = getClientService({
      clientMetadata: {
        token: '...',
        user: { id, claims: {}},
        ip: '127.0.0.1'
      }
    });

    assert.that(clientService.token).is.equalTo('...');
  });

  test('provides the user of the client.', async (): Promise<void> => {
    const id = uuid();

    const clientService = getClientService({
      clientMetadata: {
        token: '...',
        user: { id, claims: { sub: id }},
        ip: '127.0.0.1'
      }
    });

    assert.that(clientService.user).is.equalTo({ id, claims: { sub: id }});
  });

  test('provides the IP of the client.', async (): Promise<void> => {
    const id = uuid();

    const clientService = getClientService({
      clientMetadata: {
        token: '...',
        user: { id, claims: {}},
        ip: '127.0.0.1'
      }
    });

    assert.that(clientService.ip).is.equalTo('127.0.0.1');
  });
});

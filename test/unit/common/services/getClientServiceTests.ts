import { assert } from 'assertthat';
import { getClientService } from '../../../../lib/common/services/getClientService';

suite('getClientService', (): void => {
  test(`provides the client's token.`, async (): Promise<void> => {
    const id = 'jane.doe';

    const clientService = getClientService({
      clientMetadata: {
        token: '...',
        user: { id, claims: { sub: id }},
        ip: '127.0.0.1'
      }
    });

    assert.that(clientService.token).is.equalTo('...');
  });

  test(`provides the client's user.`, async (): Promise<void> => {
    const id = 'jane.doe';

    const clientService = getClientService({
      clientMetadata: {
        token: '...',
        user: { id, claims: { sub: id }},
        ip: '127.0.0.1'
      }
    });

    assert.that(clientService.user).is.equalTo({ id, claims: { sub: id }});
  });

  test(`provides the client's ip.`, async (): Promise<void> => {
    const id = 'jane.doe';

    const clientService = getClientService({
      clientMetadata: {
        token: '...',
        user: { id, claims: { sub: id }},
        ip: '127.0.0.1'
      }
    });

    assert.that(clientService.ip).is.equalTo('127.0.0.1');
  });
});

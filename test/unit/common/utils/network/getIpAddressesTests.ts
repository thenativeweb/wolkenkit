import { assert } from 'assertthat';
import { getIpAddresses } from '../../../../../lib/common/utils/network/getIpAddresses';

suite('getIpAddresses', (): void => {
  test('returns addresses if ip is given.', async (): Promise<void> => {
    const addresses = await getIpAddresses('127.0.0.1');

    assert.that(addresses).is.equalTo([{ address: '127.0.0.1', family: 4 }]);
  });

  test('returns addresses if host is given.', async (): Promise<void> => {
    const addresses = await getIpAddresses('localhost');

    assert.that(addresses.some(
      (item: any): boolean =>
        (item.address === '127.0.0.1' && item.family === 4) ||
        (item.address === '::1' && item.family === 6)
    )).is.true();
  });
});

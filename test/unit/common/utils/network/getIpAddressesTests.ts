import assert from 'assertthat';
import getIpAddresses from '../../../../../src/common/utils/network/getIpAddresses';

suite('getIpAddresses', () => {
  test('returns addresses if ip is given.', async () => {
    const addresses = await getIpAddresses('127.0.0.1');

    assert.that(addresses).is.equalTo([{ address: '127.0.0.1', family: 4 }]);
  });

  test('returns addresses if host is given.', async () => {
    const addresses = await getIpAddresses('localhost');

    assert.that(addresses.some(
      item =>
        (item.address === '127.0.0.1' && item.family === 4) ||
        (item.address === '::1' && item.family === 6)
    )).is.true();
  });
});

'use strict';

const assert = require('assertthat');

const getIpAddresses = require('../../../../../common/utils/network/getIpAddresses');

suite('getIpAddresses', () => {
  test('is a function.', async () => {
    assert.that(getIpAddresses).is.ofType('function');
  });

  test('throws an error if host or ip is missing.', async () => {
    await assert.that(async () => {
      await getIpAddresses();
    }).is.throwingAsync('Host or IP is missing.');
  });

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

'use strict';

const assert = require('assertthat');

const getIpAddresses = require('../../../lib/network/getIpAddresses');

suite('network/getIpAddresses', () => {
  test('is a function.', done => {
    assert.that(getIpAddresses).is.ofType('function');
    done();
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

    assert.that(
      addresses.filter(item => item.address === '127.0.0.1' || item.address === '::1')
    ).is.equalTo([
      { address: '127.0.0.1', family: 4 },
      { address: '::1', family: 6 }
    ]);
  });
});

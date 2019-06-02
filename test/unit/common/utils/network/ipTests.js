'use strict';

const assert = require('assertthat');

const ip = require('../../../../../common/utils/network/ip');

suite('ip', () => {
  test('is an object.', async () => {
    assert.that(ip).is.ofType('object');
  });

  suite('is', () => {
    test('is a function.', async () => {
      assert.that(ip.is).is.ofType('function');
    });

    test('returns false if an invalid ip address is given.', async () => {
      assert.that(ip.is('not-ip')).is.false();
    });

    test('returns true if an valid ip address is given.', async () => {
      assert.that(ip.is('127.0.0.1')).is.true();
    });
  });

  suite('isV4', () => {
    test('is a function.', async () => {
      assert.that(ip.isV4).is.ofType('function');
    });

    test('returns false if an invalid ip address is given.', async () => {
      assert.that(ip.isV4('not-ip')).is.false();
    });

    test('returns false if an v6 ip address is given.', async () => {
      assert.that(ip.isV4('::1')).is.false();
    });

    test('returns true if an v4 ip address is given.', async () => {
      assert.that(ip.isV4('127.0.0.1')).is.true();
    });
  });

  suite('isV6', () => {
    test('is a function.', async () => {
      assert.that(ip.isV6).is.ofType('function');
    });

    test('returns false if an invalid ip address is given.', async () => {
      assert.that(ip.isV6('not-ip')).is.false();
    });

    test('returns false if an v4 ip address is given.', async () => {
      assert.that(ip.isV6('127.0.0.1')).is.false();
    });

    test('returns true if an v6 ip address is given.', async () => {
      assert.that(ip.isV6('::1')).is.true();
    });
  });

  suite('getFamily', () => {
    test('is a function.', async () => {
      assert.that(ip.getFamily).is.ofType('function');
    });

    test('throws an error if an invalid ip address is given.', async () => {
      assert.that(() => {
        ip.getFamily('not-ip');
      }).is.throwing('Invalid IP address.');
    });

    test('returns 4 if an v4 ip address is given.', async () => {
      assert.that(ip.getFamily('127.0.0.1')).is.equalTo(4);
    });

    test('returns 6 if an v6 ip address is given.', async () => {
      assert.that(ip.getFamily('::1')).is.equalTo(6);
    });
  });
});

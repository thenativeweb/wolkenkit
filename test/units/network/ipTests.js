'use strict';

const assert = require('assertthat');

const ip = require('../../../lib/network/ip');

suite('network/ip', () => {
  test('is an object.', done => {
    assert.that(ip).is.ofType('object');
    done();
  });

  suite('is', () => {
    test('is a function.', done => {
      assert.that(ip.is).is.ofType('function');
      done();
    });

    test('returns false if an invalid ip address is given.', done => {
      assert.that(ip.is('not-ip')).is.false();
      done();
    });

    test('returns true if an valid ip address is given.', done => {
      assert.that(ip.is('127.0.0.1')).is.true();
      done();
    });
  });

  suite('isV4', () => {
    test('is a function.', done => {
      assert.that(ip.isV4).is.ofType('function');
      done();
    });

    test('returns false if an invalid ip address is given.', done => {
      assert.that(ip.isV4('not-ip')).is.false();
      done();
    });

    test('returns false if an v6 ip address is given.', done => {
      assert.that(ip.isV4('::1')).is.false();
      done();
    });

    test('returns true if an v4 ip address is given.', done => {
      assert.that(ip.isV4('127.0.0.1')).is.true();
      done();
    });
  });

  suite('isV6', () => {
    test('is a function.', done => {
      assert.that(ip.isV6).is.ofType('function');
      done();
    });

    test('returns false if an invalid ip address is given.', done => {
      assert.that(ip.isV6('not-ip')).is.false();
      done();
    });

    test('returns false if an v4 ip address is given.', done => {
      assert.that(ip.isV6('127.0.0.1')).is.false();
      done();
    });

    test('returns true if an v6 ip address is given.', done => {
      assert.that(ip.isV6('::1')).is.true();
      done();
    });
  });

  suite('getFamily', () => {
    test('is a function.', done => {
      assert.that(ip.getFamily).is.ofType('function');
      done();
    });

    test('throws an error if an invalid ip address is given.', done => {
      assert.that(() => {
        ip.getFamily('not-ip');
      }).is.throwing('Invalid IP address.');
      done();
    });

    test('returns 4 if an v4 ip address is given.', done => {
      assert.that(ip.getFamily('127.0.0.1')).is.equalTo(4);
      done();
    });

    test('returns 6 if an v6 ip address is given.', done => {
      assert.that(ip.getFamily('::1')).is.equalTo(6);
      done();
    });
  });
});

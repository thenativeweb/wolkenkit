'use strict';

const assert = require('assertthat');

const isNameMatching = require('../../../../../clis/wolkenkit/certificate/isNameMatching');

suite('isNameMatching', () => {
  test('is a function.', done => {
    assert.that(isNameMatching).is.ofType('function');
    done();
  });

  test('throws an error when certificate is missing.', done => {
    assert.that(() => {
      isNameMatching({});
    }).is.throwing('Certificate is missing.');
    done();
  });

  test('throws an error when name is missing.', done => {
    assert.that(() => {
      isNameMatching({ certificate: {}});
    }).is.throwing('Name is missing.');
    done();
  });

  test('returns true when the common name matches the expected name.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: { commonName: 'www.example.com' }
      },
      name: 'www.example.com'
    })).is.true();
    done();
  });

  test('returns false when the common name does not match the expected name.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: { commonName: 'www.example.com' }
      },
      name: 'example.com'
    })).is.false();
    done();
  });

  test('returns true when the common name matches the expected name using a wildcard.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: { commonName: '*.example.com' }
      },
      name: 'www.example.com'
    })).is.true();
    done();
  });

  test('returns false when the common name does not match the expected name using a wildcard.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: { commonName: '*.example.com' }
      },
      name: 'example.com'
    })).is.false();
    done();
  });

  test('returns false when the common name does not match the expected name using a wildcard because of nesting.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: { commonName: '*.example.com' }
      },
      name: 'foo.bar.example.com'
    })).is.false();
    done();
  });

  test('returns false when the common name does not match the expected name using a wildcard because the domain itself is wrong.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: { commonName: '*.example.com' }
      },
      name: 'foo.bar.com'
    })).is.false();
    done();
  });

  test('returns true when the subject alternative names include the expected name.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: {
          commonName: 'foo.bar.com',
          alternativeNames: [ 'example.com', 'www.example.com' ]
        }
      },
      name: 'www.example.com'
    })).is.true();
    done();
  });

  test('returns false when the subject alternative names do not include the expected name.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: {
          commonName: 'foo.bar.com',
          alternativeNames: [ 'example.com', 'www.example.com' ]
        }
      },
      name: 'test.example.com'
    })).is.false();
    done();
  });

  test('returns true when the subject alternative names match the expected name using a wildcard.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: {
          commonName: 'foo.bar.com',
          alternativeNames: [ 'example.com', '*.example.com' ]
        }
      },
      name: 'www.example.com'
    })).is.true();
    done();
  });

  test('returns false when the subject alternative names do not match the expected name using a wildcard.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: {
          commonName: 'test.example.com',
          alternativeNames: [ '*.example.com' ]
        }
      },
      name: 'example.com'
    })).is.false();
    done();
  });

  test('returns false when the subject alternative names do not match the expected name using a wildcard because of nesting.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: {
          commonName: 'test.example.com',
          alternativeNames: [ '*.example.com' ]
        }
      },
      name: 'foo.bar.example.com'
    })).is.false();
    done();
  });

  test('returns false when the subject alternative names do not match the expected name using a wildcard because the domain itself is wrong.', done => {
    assert.that(isNameMatching({
      certificate: {
        subject: {
          commonName: 'test.example.com',
          alternativeNames: [ 'example.com', '*.example.com' ]
        }
      },
      name: 'foo.bar.com'
    })).is.false();
    done();
  });
});

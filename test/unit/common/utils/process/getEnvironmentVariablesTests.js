'use strict';

const assert = require('assertthat'),
      nodeenv = require('nodeenv');

const getEnvironmentVariables = require('../../../../../common/utils/process/getEnvironmentVariables');

suite('getEnvironmentVariables', () => {
  test('is a function.', async () => {
    assert.that(getEnvironmentVariables).is.ofType('function');
  });

  test('throws an error if required environment variables is missing.', async () => {
    assert.that(() => {
      getEnvironmentVariables();
    }).is.throwing('Required environment variables is missing.');
  });

  test('returns the required environment variables if they are set.', async () => {
    const restore = nodeenv({ FOO: 'bar', BAZ: 'bas' });

    const environmentVariables = getEnvironmentVariables({
      FOO: 'fooDefault',
      BAZ: 'bazDefault'
    });

    assert.that(environmentVariables).is.equalTo({ FOO: 'bar', BAZ: 'bas' });

    restore();
  });

  test('returns the defaults for the required environment variables if they are not set.', async () => {
    const restore = nodeenv({ FOO: undefined, BAZ: undefined });

    const environmentVariables = getEnvironmentVariables({
      FOO: 'fooDefault',
      BAZ: 'bazDefault'
    });

    assert.that(environmentVariables).is.equalTo({
      FOO: 'fooDefault',
      BAZ: 'bazDefault'
    });

    restore();
  });

  test('throws an error if no default is given and a required environment variable is not set.', async () => {
    const restore = nodeenv({ FOO: undefined });

    assert.that(() => {
      getEnvironmentVariables({ FOO: undefined });
    }).is.throwing(`Required environment variable 'FOO' is not set.`);

    restore();
  });
});

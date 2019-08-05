import assert from 'assertthat';
import getEnvironmentVariables from '../../../../../src/common/utils/process/getEnvironmentVariables';
import nodeenv from 'nodeenv';

suite('getEnvironmentVariables', () => {
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

import { assert } from 'assertthat';
import { getEnvironmentVariables } from '../../../../../lib/common/utils/process/getEnvironmentVariables';
import { nodeenv } from 'nodeenv';

suite('getEnvironmentVariables', (): void => {
  test('returns the required environment variables if they are set.', async (): Promise<void> => {
    const restore = nodeenv({ FOO: 'bar', BAZ: 'bas' });

    const environmentVariables = getEnvironmentVariables({
      FOO: { default: 'fooDefault' },
      BAZ: { default: 'bazDefault' }
    });

    assert.that(environmentVariables).is.equalTo({ FOO: 'bar', BAZ: 'bas' });

    restore();
  });

  test('returns the required environment variable if the schema matches.', async (): Promise<void> => {
    const restore = nodeenv({ FOO: 'bar' });

    const environmentVariables = getEnvironmentVariables({
      FOO: {
        default: 'fooDefault',
        schema: { type: 'string' }
      }
    });

    assert.that(environmentVariables.FOO).is.equalTo('bar');

    restore();
  });

  test('returns the defaults for the required environment variables if they are not set.', async (): Promise<void> => {
    const restore = nodeenv({ FOO: undefined, BAZ: undefined });

    const environmentVariables = getEnvironmentVariables({
      FOO: { default: 'fooDefault' },
      BAZ: { default: 'bazDefault' }
    });

    assert.that(environmentVariables).is.equalTo({
      FOO: 'fooDefault',
      BAZ: 'bazDefault'
    });

    restore();
  });

  test('throws an error if no default is given and a required environment variable is not set.', async (): Promise<void> => {
    const restore = nodeenv({ FOO: undefined });

    assert.that((): void => {
      getEnvironmentVariables({ FOO: {}});
    }).is.throwing(`Required environment variable 'FOO' is not set.`);

    restore();
  });

  test('throws an error if the environment variable does not match the schema.', async (): Promise<void> => {
    const restore = nodeenv({ FOO: '1234' });

    assert.that((): void => {
      getEnvironmentVariables({
        FOO: {
          default: undefined,
          schema: { type: 'string' }
        }
      });
    }).is.throwing('Invalid type: integer should be string (at FOO).');

    restore();
  });

  test('throws an error if the environment variable is not set and the default does not match the schema.', async (): Promise<void> => {
    assert.that((): void => {
      getEnvironmentVariables({
        FOO: {
          default: 1234,
          schema: { type: 'string' }
        }
      });
    }).is.throwing('Invalid type: integer should be string (at FOO).');
  });
});

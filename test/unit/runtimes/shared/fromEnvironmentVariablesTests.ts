import { assert } from 'assertthat';
import { ConfigurationDefinition } from '../../../../lib/runtimes/shared/ConfigurationDefinition';
import { fromEnvironmentVariables } from '../../../../lib/runtimes/shared/fromEnvironmentVariables';
import { nodeenv } from 'nodeenv';

interface Configuration {
  foo: string;
  bar: number;
}

suite('fromEnvironmentVariables', (): void => {
  test('reads environment variables according to a configuraton definition.', async (): Promise<void> => {
    const configurationDefinition: ConfigurationDefinition<Configuration> = {
      foo: {
        environmentVariable: 'FOO_ENV_VAR',
        defaultValue: 'bat',
        schema: { type: 'string' }
      },
      bar: {
        environmentVariable: 'BAR',
        defaultValue: 0,
        schema: { type: 'number' }
      }
    };

    const reset = nodeenv({
      FOO_ENV_VAR: 'foo',
      BAR: '5'
    });

    const configuration = fromEnvironmentVariables({ configurationDefinition });

    assert.that(configuration).is.equalTo({
      foo: 'foo',
      bar: 5
    });

    reset();
  });
});

import { assert } from 'assertthat';
import { ConfigurationDefinition } from '../../../../lib/runtimes/shared/ConfigurationDefinition';
import { toEnvironmentVariables } from '../../../../lib/runtimes/shared/toEnvironmentVariables';

interface Configuration {
  foo: string;
  bar: number;
}

suite('toEnvironmentVariables', (): void => {
  test('builds a record of environment variables from a configuration and a configuration definition.', async (): Promise<void> => {
    const configuration: Configuration = {
      foo: 'baz',
      bar: 5
    };

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

    const environmentVariables = toEnvironmentVariables({ configuration, configurationDefinition });

    assert.that(environmentVariables).is.equalTo({
      FOO_ENV_VAR: 'baz',
      BAR: '5'
    });
  });
});

import { assert } from 'assertthat';
import { ConfigurationDefinition } from '../../../../lib/runtimes/shared/ConfigurationDefinition';
import { toEnvironmentVariables } from '../../../../lib/runtimes/shared/toEnvironmentVariables';

interface Configuration {
  foo: string;
  bar: {
    baz: number;
  };
}

suite('toEnvironmentVariables', (): void => {
  test('builds a record of environment variables from a configuration and a configuration definition.', async (): Promise<void> => {
    const configuration: Configuration = {
      foo: 'baz',
      bar: { baz: 5 }
    };

    const configurationDefinition: ConfigurationDefinition<Configuration> = {
      foo: {
        environmentVariable: 'FOO_ENV_VAR',
        defaultValue: 'bat',
        schema: { type: 'string' }
      },
      bar: {
        environmentVariable: 'BAR',
        defaultValue: { baz: 0 },
        schema: { type: 'object', properties: { baz: { type: 'number' }}, required: [ 'baz' ], additionalProperties: false }
      }
    };

    const environmentVariables = toEnvironmentVariables({ configuration, configurationDefinition });

    assert.that(environmentVariables).is.equalTo({
      FOO_ENV_VAR: 'baz',
      BAR: '{"baz":5}'
    });
  });
});

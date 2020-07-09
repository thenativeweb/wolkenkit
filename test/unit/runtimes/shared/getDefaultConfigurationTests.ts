import { assert } from 'assertthat';
import { ConfigurationDefinition } from '../../../../lib/runtimes/shared/ConfigurationDefinition';
import { getDefaultConfiguration } from '../../../../lib/runtimes/shared/getDefaultConfiguration';

interface Configuration {
  foo: string;
  bar: number;
}

suite('getDefaultConfiguration', (): void => {
  test('retrieves the default values from a configuration definition.', async (): Promise<void> => {
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

    const configuration = getDefaultConfiguration({ configurationDefinition });

    assert.that(configuration).is.equalTo({
      foo: 'bat',
      bar: 0
    });
  });
});

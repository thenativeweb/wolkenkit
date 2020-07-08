import { ConfigurationDefinition } from './ConfigurationDefinition';
import { ConfigurationDefinitionItem } from './ConfigurationDefinitionItem';
import { processenv } from 'processenv';
import { Value } from 'validate-value';

const fromEnvironmentVariables = function <TConfiguration extends object> ({ configurationDefinition }: {
  configurationDefinition: ConfigurationDefinition<TConfiguration>;
}): TConfiguration {
  const configuration: Record<string, any> = {};

  for (const [ key, rawDefinition ] of Object.entries(configurationDefinition)) {
    const definition = rawDefinition as ConfigurationDefinitionItem<any>;

    const value = processenv(definition.environmentVariable, definition.defaultValue);
    const validator = new Value(definition.schema);

    validator.validate(value, { valueName: key });

    if (value === undefined) {
      throw new Error(`Required environment variable '${definition.environmentVariable}' is not set.`);
    }

    configuration[key] = value as any;
  }

  return configuration as TConfiguration;
};

export { fromEnvironmentVariables };

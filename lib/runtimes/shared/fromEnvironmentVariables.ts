import { ConfigurationDefinition } from './ConfigurationDefinition';
import { ConfigurationDefinitionItem } from './ConfigurationDefinitionItem';
import { parse } from 'validate-value';
import { processenv } from 'processenv';

const fromEnvironmentVariables = async function <TConfiguration extends object> ({ configurationDefinition }: {
  configurationDefinition: ConfigurationDefinition<TConfiguration>;
}): Promise<TConfiguration> {
  const configuration: Record<string, any> = {};

  for (const [ key, rawDefinition ] of Object.entries(configurationDefinition)) {
    const definition = rawDefinition as ConfigurationDefinitionItem<any>;

    const value = await processenv(definition.environmentVariable, definition.defaultValue);

    parse(
      value,
      definition.schema,
      { valueName: key }
    ).unwrapOrThrow();

    if (value === undefined) {
      throw new Error(`Required environment variable '${definition.environmentVariable}' is not set.`);
    }

    configuration[key] = value as any;
  }

  return configuration as TConfiguration;
};

export { fromEnvironmentVariables };

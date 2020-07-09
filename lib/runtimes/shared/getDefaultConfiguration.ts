import { ConfigurationDefinition } from './ConfigurationDefinition';
import { ConfigurationDefinitionItem } from './ConfigurationDefinitionItem';

const getDefaultConfiguration = function <TConfiguration extends object> ({ configurationDefinition }: {
  configurationDefinition: ConfigurationDefinition<TConfiguration>;
}): TConfiguration {
  const configuration: Record<string, any> = {};

  for (const [ key, rawDefinition ] of Object.entries(configurationDefinition)) {
    const definition = rawDefinition as ConfigurationDefinitionItem<any>;

    configuration[key] = definition.defaultValue;
  }

  return configuration as TConfiguration;
};

export { getDefaultConfiguration };

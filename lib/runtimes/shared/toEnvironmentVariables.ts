import { ConfigurationDefinition } from './ConfigurationDefinition';
import { ConfigurationDefinitionItem } from './ConfigurationDefinitionItem';

const toEnvironmentVariables = function <TConfiguration extends object> ({ configuration, configurationDefinition }: {
  configuration: TConfiguration;
  configurationDefinition: ConfigurationDefinition<TConfiguration>;
}): Record<string, string> {
  const environmentVariables: Record<string, string> = {};

  for (const [ key, rawDefinition ] of Object.entries(configurationDefinition)) {
    const definition = rawDefinition as ConfigurationDefinitionItem<any>;
    const value = (configuration as any)[key];

    if (typeof value === 'object') {
      environmentVariables[definition.environmentVariable] = JSON.stringify(value);
    } else {
      environmentVariables[definition.environmentVariable] = String(value);
    }
  }

  return environmentVariables;
};

export { toEnvironmentVariables };

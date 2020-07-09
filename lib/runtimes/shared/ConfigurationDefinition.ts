import { ConfigurationDefinitionItem } from './ConfigurationDefinitionItem';

export type ConfigurationDefinition<TConfiguration> = {
  [TKey in keyof TConfiguration]: ConfigurationDefinitionItem<TConfiguration[TKey]>
};

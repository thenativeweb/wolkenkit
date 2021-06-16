import { ConfigurationDefinitionItem } from './ConfigurationDefinitionItem';
export declare type ConfigurationDefinition<TConfiguration> = {
    [TKey in keyof TConfiguration]: ConfigurationDefinitionItem<TConfiguration[TKey]>;
};

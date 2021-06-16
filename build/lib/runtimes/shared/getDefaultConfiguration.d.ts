import { ConfigurationDefinition } from './ConfigurationDefinition';
declare const getDefaultConfiguration: <TConfiguration extends object>({ configurationDefinition }: {
    configurationDefinition: ConfigurationDefinition<TConfiguration>;
}) => TConfiguration;
export { getDefaultConfiguration };

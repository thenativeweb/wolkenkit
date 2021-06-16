import { ConfigurationDefinition } from './ConfigurationDefinition';
declare const toEnvironmentVariables: <TConfiguration extends object>({ configuration, configurationDefinition }: {
    configuration: TConfiguration;
    configurationDefinition: ConfigurationDefinition<TConfiguration>;
}) => Record<string, string>;
export { toEnvironmentVariables };

import { ConfigurationDefinition } from './ConfigurationDefinition';
declare const fromEnvironmentVariables: <TConfiguration extends object>({ configurationDefinition }: {
    configurationDefinition: ConfigurationDefinition<TConfiguration>;
}) => Promise<TConfiguration>;
export { fromEnvironmentVariables };

export interface Configuration {
  applicationDirectory: string;
  dispatcherHostName: string;
  dispatcherPort: number;
  aeonstoreHostName: string;
  aeonstorePort: string;
  healthCorsOrigin: string | string[];
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  concurrentCommands: number;
}

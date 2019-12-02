export interface Configuration {
  applicationDirectory: string;
  commandCorsOrigin: string | string[];
  dispatcherHostName: string;
  dispatcherPort: number;
  dispatcherRetries: number;
  healthCorsOrigin: string | string[];
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
}

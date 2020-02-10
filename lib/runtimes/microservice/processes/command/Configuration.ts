export interface Configuration {
  applicationDirectory: string;
  commandCorsOrigin: string | string[];
  dispatcherProtocol: string;
  dispatcherHostName: string;
  dispatcherPort: number;
  dispatcherRetries: number;
  healthCorsOrigin: string | string[];
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  healthPort: number;
}

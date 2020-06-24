export interface Configuration {
  applicationDirectory: string;
  commandCorsOrigin: string | string[];
  commandDispatcherProtocol: string;
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  commandDispatcherRetries: number;
  healthCorsOrigin: string | string[];
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  healthPort: number;
  enableOpenApiDocumentation: boolean;
}

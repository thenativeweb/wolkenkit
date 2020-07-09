export interface Configuration {
  applicationDirectory: string;
  commandCorsOrigin: string | string[];
  commandDispatcherHostName: string;
  commandDispatcherPort: number;
  commandDispatcherProtocol: string;
  commandDispatcherRetries: number;
  enableOpenApiDocumentation: boolean;
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
}

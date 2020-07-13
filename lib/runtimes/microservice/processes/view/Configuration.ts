export interface Configuration {
  applicationDirectory: string;
  corsOrigin: string | string[];
  enableOpenApiDocumentation: boolean;
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
}

export interface Configuration {
  applicationDirectory: string;
  enableOpenApiDocumentation: boolean;
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  viewCorsOrigin: string | string[];
}

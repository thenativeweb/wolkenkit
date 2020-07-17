export interface Configuration {
  applicationDirectory: string;
  enableOpenApiDocumentation: boolean;
  fileCorsOrigin: string | string[];
  fileStoreOptions: Record<string, any>;
  fileStoreType: string;
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
}

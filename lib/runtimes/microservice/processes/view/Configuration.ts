export interface Configuration {
  applicationDirectory: string;
  corsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
}

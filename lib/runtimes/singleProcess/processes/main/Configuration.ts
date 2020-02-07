export interface Configuration {
  applicationDirectory: string;
  corsOrigin: string | string[];
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  healthPort: number;
}

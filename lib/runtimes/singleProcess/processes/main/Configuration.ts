export interface Configuration {
  applicationDirectory: string;
  healthCorsOrigin: string | string[];
  commandCorsOrigin: string | string[];
  domainEventCorsOrigin: string | string[];
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
}

export interface Configuration {
  applicationDirectory: string;
  domainEventCorsOrigin: string | string[];
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  healthCorsOrigin: string | string[];
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
  subscribeMessagesProtocol: string;
  subscribeMessagesHostName: string;
  subscribeMessagesPort: number;
}

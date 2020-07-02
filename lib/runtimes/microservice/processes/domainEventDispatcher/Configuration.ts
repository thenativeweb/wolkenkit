export interface Configuration {
  applicationDirectory: string;
  priorityQueueStoreType: string;
  priorityQueueStoreOptions: object & { expirationTime: number };
  pubSubType: string;
  pubSubOptions: {
    channel: string;
    subscriber: object;
    publisher: object;
  };
  awaitDomainEventCorsOrigin: string | string[];
  handleDomainEventCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  port: number;
  healthPort: number;
  missedDomainEventRecoveryInterval: number;
}

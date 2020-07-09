export interface Configuration {
  applicationDirectory: string;
  awaitDomainEventCorsOrigin: string | string[];
  handleDomainEventCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  healthPort: number;
  missedDomainEventRecoveryInterval: number;
  port: number;
  priorityQueueStoreOptions: object & { expirationTime: number };
  priorityQueueStoreType: string;
  pubSubOptions: {
    channel: string;
    publisher: object;
    subscriber: object;
  };
  pubSubType: string;
}

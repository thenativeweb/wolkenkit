export interface Configuration {
  applicationDirectory: string;
  awaitDomainEventCorsOrigin: string | string[];
  handleDomainEventCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  healthPort: number;
  missedDomainEventRecoveryInterval: number;
  port: number;
  priorityQueueStoreOptions: Record<string, any> & { expirationTime: number };
  priorityQueueStoreType: string;
  pubSubOptions: {
    channel: string;
    publisher: object;
    subscriber: object;
  };
  pubSubType: string;
}

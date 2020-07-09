export interface Configuration {
  applicationDirectory: string;
  awaitCommandCorsOrigin: string | string[];
  handleCommandCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  healthPort: number;
  missedCommandRecoveryInterval: number;
  port: number;
  priorityQueueStoreOptions: Record<string, any> & { expirationTime: number };
  priorityQueueStoreType: string;
  pubSubOptions: {
    channel: string;
    subscriber: object;
    publisher: object;
  };
  pubSubType: string;
}

export interface Configuration {
  applicationDirectory: string;
  priorityQueueStoreType: string;
  priorityQueueStoreOptions: object;
  awaitCommandCorsOrigin: string | string[];
  handleCommandCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  port: number;
  queueLockExpirationTime: number;
  queuePollInterval: number;
}

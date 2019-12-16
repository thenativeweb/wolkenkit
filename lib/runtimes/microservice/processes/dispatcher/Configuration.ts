export interface Configuration {
  applicationDirectory: string;
  priorityQueueStoreType: string;
  priorityQueueStoreOptions: object & { expirationTime: number };
  awaitCommandCorsOrigin: string | string[];
  handleCommandCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  port: number;
  queuePollInterval: number;
}

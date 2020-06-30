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
  subscribeMessagesProtocol: string;
  subscribeMessagesHostName: string;
  subscribeMessagesPort: number;
  subscribeMessagesChannel: string;
  awaitCommandCorsOrigin: string | string[];
  handleCommandCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  port: number;
  healthPort: number;
  missedCommandRecoveryInterval: number;
}

export interface Configuration {
  applicationDirectory: string;
  dispatcherProtocol: string;
  dispatcherHostName: string;
  dispatcherPort: number;
  dispatcherRenewInterval: number;
  dispatcherAcknowledgeRetries: number;
  aeonstoreProtocol: string;
  aeonstoreHostName: string;
  aeonstorePort: number;
  aeonstoreRetries: number;
  healthCorsOrigin: string | string[];
  port: number;
  concurrentCommands: number;
}

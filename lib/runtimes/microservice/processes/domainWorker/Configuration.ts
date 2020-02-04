export interface Configuration {
  applicationDirectory: string;
  dispatcherHostName: string;
  dispatcherPort: number;
  aeonstoreHostName: string;
  aeonstorePort: number;
  healthCorsOrigin: string | string[];
  port: number;
  concurrentCommands: number;
}

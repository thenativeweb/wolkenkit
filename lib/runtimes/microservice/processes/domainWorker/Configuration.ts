export interface Configuration {
  applicationDirectory: string;
  dispatcherHostName: string;
  dispatcherPort: number;
  aeonstoreHostName: string;
  aeonstorePort: string;
  healthCorsOrigin: string | string[];
  port: number;
  concurrentCommands: number;
}

export interface Configuration {
  applicationDirectory: string;
  domainEventDispatcherProtocol: string;
  domainEventDispatcherHostName: string;
  domainEventDispatcherPort: number;
  aeonstoreProtocol: string;
  aeonstoreHostName: string;
  aeonstorePort: number;
  healthCorsOrigin: string | string[];
  healthPort: number;
  corsOrigin: string | string[];
  port: number;
}

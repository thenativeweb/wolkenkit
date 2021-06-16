export interface Configuration {
    aeonstoreHostName: string;
    aeonstorePortOrSocket: number | string;
    aeonstoreProtocol: string;
    applicationDirectory: string;
    corsOrigin: string | string[];
    domainEventDispatcherHostName: string;
    domainEventDispatcherPortOrSocket: number | string;
    domainEventDispatcherProtocol: string;
    healthCorsOrigin: string | string[];
    healthPortOrSocket: number | string;
    portOrSocket: number | string;
}

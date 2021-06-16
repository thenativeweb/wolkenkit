export interface Configuration {
    applicationDirectory: string;
    commandCorsOrigin: string | string[];
    commandDispatcherHostName: string;
    commandDispatcherPortOrSocket: number | string;
    commandDispatcherProtocol: string;
    commandDispatcherRetries: number;
    enableOpenApiDocumentation: boolean;
    healthCorsOrigin: string | string[];
    healthPortOrSocket: number | string;
    identityProviders: {
        issuer: string;
        certificate: string;
    }[];
    portOrSocket: number | string;
}

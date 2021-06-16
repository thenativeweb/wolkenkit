export interface HttpPublisherOptions {
    type: 'Http';
    protocol?: string;
    hostName: string;
    portOrSocket: number | string;
    path?: string;
}

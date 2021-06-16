export interface HttpSubscriberOptions {
    type: 'Http';
    protocol?: string;
    hostName: string;
    portOrSocket: number | string;
    path?: string;
}

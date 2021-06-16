import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';
export interface Configuration {
    applicationDirectory: string;
    healthCorsOrigin: string | string[];
    healthPortOrSocket: number | string;
    heartbeatInterval: number;
    identityProviders: {
        issuer: string;
        certificate: string;
    }[];
    notificationCorsOrigin: string | string[];
    portOrSocket: number | string;
    pubSubOptions: {
        channelForNotifications: string;
        subscriber: SubscriberOptions;
    };
}

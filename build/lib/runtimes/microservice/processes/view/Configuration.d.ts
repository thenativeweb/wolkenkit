import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';
export interface Configuration {
    applicationDirectory: string;
    enableOpenApiDocumentation: boolean;
    healthCorsOrigin: string | string[];
    healthPortOrSocket: number | string;
    identityProviders: {
        issuer: string;
        certificate: string;
    }[];
    portOrSocket: number | string;
    pubSubOptions: {
        channelForNotifications: string;
        publisher: PublisherOptions;
        subscriber: SubscriberOptions;
    };
    viewCorsOrigin: string | string[];
}

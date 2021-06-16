import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';
export interface Configuration {
    aeonstoreHostName: string;
    aeonstorePortOrSocket: number | string;
    aeonstoreProtocol: string;
    applicationDirectory: string;
    domainEventCorsOrigin: string | string[];
    enableOpenApiDocumentation: boolean;
    healthCorsOrigin: string | string[];
    healthPortOrSocket: number | string;
    heartbeatInterval: number;
    identityProviders: {
        issuer: string;
        certificate: string;
    }[];
    portOrSocket: number | string;
    pubSubOptions: {
        channelForNewDomainEvents: string;
        channelForNotifications: string;
        publisher: PublisherOptions;
        subscriber: SubscriberOptions;
    };
    snapshotStrategy: SnapshotStrategyConfiguration;
}

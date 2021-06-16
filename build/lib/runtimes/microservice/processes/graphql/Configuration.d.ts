import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';
export interface Configuration {
    aeonstoreHostName: string;
    aeonstorePortOrSocket: number | string;
    aeonstoreProtocol: string;
    applicationDirectory: string;
    commandDispatcherHostName: string;
    commandDispatcherPortOrSocket: number | string;
    commandDispatcherProtocol: string;
    commandDispatcherRetries: number;
    corsOrigin: string | string[];
    enableIntegratedClient: boolean;
    healthPortOrSocket: number | string;
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

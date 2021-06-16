import { LockStoreOptions } from '../../../../stores/lockStore/LockStoreOptions';
import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
export interface Configuration {
    aeonstoreHostName: string;
    aeonstorePortOrSocket: number | string;
    aeonstoreProtocol: string;
    applicationDirectory: string;
    commandDispatcherAcknowledgeRetries: number;
    commandDispatcherHostName: string;
    commandDispatcherPortOrSocket: number | string;
    commandDispatcherProtocol: string;
    commandDispatcherRenewInterval: number;
    concurrentCommands: number;
    domainEventDispatcherHostName: string;
    domainEventDispatcherPortOrSocket: number | string;
    domainEventDispatcherProtocol: string;
    healthCorsOrigin: string | string[];
    healthPortOrSocket: number | string;
    lockStoreOptions: LockStoreOptions;
    pubSubOptions: {
        channelForNewDomainEvents: string;
        channelForNotifications: string;
        publisher: PublisherOptions;
    };
    snapshotStrategy: SnapshotStrategyConfiguration;
}

import { ConsumerProgressStoreOptions } from '../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { LockStoreOptions } from '../../../../stores/lockStore/LockStoreOptions';
import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
export interface Configuration {
    aeonstoreHostName: string;
    aeonstorePortOrSocket: number | string;
    aeonstoreProtocol: string;
    applicationDirectory: string;
    commandDispatcherHostName: string;
    commandDispatcherPortOrSocket: number | string;
    commandDispatcherProtocol: string;
    concurrentFlows: number;
    consumerProgressStoreOptions: ConsumerProgressStoreOptions;
    domainEventDispatcherAcknowledgeRetries: number;
    domainEventDispatcherHostName: string;
    domainEventDispatcherPortOrSocket: number | string;
    domainEventDispatcherProtocol: string;
    domainEventDispatcherRenewInterval: number;
    healthCorsOrigin: string | string[];
    healthPortOrSocket: number | string;
    lockStoreOptions: LockStoreOptions;
    replayServerHostName: string;
    replayServerPortOrSocket: number | string;
    replayServerProtocol: string;
    pubSubOptions: {
        channelForNotifications: string;
        publisher: PublisherOptions;
    };
    snapshotStrategy: SnapshotStrategyConfiguration;
}

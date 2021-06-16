import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { ConsumerProgressStoreOptions } from '../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { DistributiveOmit } from '../../../../common/types/DistributiveOmit';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStoreOptions } from '../../../../stores/domainEventStore/DomainEventStoreOptions';
import { FileStoreOptions } from '../../../../stores/fileStore/FileStoreOptions';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { LockStoreOptions } from '../../../../stores/lockStore/LockStoreOptions';
import { PriorityQueueStoreOptions } from '../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';
import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';
interface Configuration {
    applicationDirectory: string;
    commandQueueRenewInterval: number;
    concurrentCommands: number;
    concurrentFlows: number;
    consumerProgressStoreOptions: ConsumerProgressStoreOptions;
    corsOrigin: string | string[];
    domainEventStoreOptions: DomainEventStoreOptions;
    enableOpenApiDocumentation: boolean;
    fileStoreOptions: FileStoreOptions;
    graphqlApi: false | {
        enableIntegratedClient: boolean;
    };
    healthPortOrSocket: number | string;
    heartbeatInterval: number;
    httpApi: boolean;
    identityProviders: {
        issuer: string;
        certificate: string;
    }[];
    lockStoreOptions: LockStoreOptions;
    portOrSocket: number | string;
    priorityQueueStoreForCommandsOptions: DistributiveOmit<PriorityQueueStoreOptions<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'>;
    priorityQueueStoreForDomainEventsOptions: DistributiveOmit<PriorityQueueStoreOptions<DomainEvent<DomainEventData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'>;
    pubSubOptions: {
        channelForNotifications: string;
        publisher: PublisherOptions;
        subscriber: SubscriberOptions;
    };
    snapshotStrategy: SnapshotStrategyConfiguration;
}
export { Configuration };

import { DistributiveOmit } from '../../../../common/types/DistributiveOmit';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { PriorityQueueStoreOptions } from '../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';
import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';

export interface Configuration {
  applicationDirectory: string;
  awaitDomainEventCorsOrigin: string | string[];
  handleDomainEventCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  healthPort: number;
  missedDomainEventRecoveryInterval: number;
  port: number;
  priorityQueueStoreOptions: DistributiveOmit<PriorityQueueStoreOptions<DomainEvent<DomainEventData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'>;
  pubSubOptions: {
    channelForNewInternalDomainEvent: string;
    publisher: PublisherOptions;
    subscriber: SubscriberOptions;
  };
}

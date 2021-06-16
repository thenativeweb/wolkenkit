import { Application } from '../../../../common/application/Application';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnReceiveDomainEvent } from '../../../../apis/handleDomainEvent/OnReceiveDomainEvent';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
declare const getOnReceiveDomainEvent: ({ application, priorityQueueStore, newDomainEventPublisher, newDomainEventPubSubChannel }: {
    application: Application;
    priorityQueueStore: PriorityQueueStore<DomainEvent<DomainEventData>, ItemIdentifierWithClient>;
    newDomainEventPublisher: Publisher<object>;
    newDomainEventPubSubChannel: string;
}) => OnReceiveDomainEvent;
export { getOnReceiveDomainEvent };

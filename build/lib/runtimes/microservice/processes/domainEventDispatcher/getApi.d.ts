import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { OnReceiveDomainEvent } from '../../../../apis/handleDomainEvent/OnReceiveDomainEvent';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ configuration, application, priorityQueueStore, newDomainEventSubscriber, newDomainEventPubSubChannel, onReceiveDomainEvent }: {
    configuration: Configuration;
    application: Application;
    priorityQueueStore: PriorityQueueStore<DomainEvent<DomainEventData>, ItemIdentifier>;
    newDomainEventSubscriber: Subscriber<object>;
    newDomainEventPubSubChannel: string;
    onReceiveDomainEvent: OnReceiveDomainEvent;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

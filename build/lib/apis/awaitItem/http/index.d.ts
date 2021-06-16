import { CorsOrigin } from 'get-cors-origin';
import { ItemIdentifier } from '../../../common/elements/ItemIdentifier';
import { PriorityQueueStore } from '../../../stores/priorityQueueStore/PriorityQueueStore';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import { Application as ExpressApplication } from 'express';
declare const getApi: <TItem extends object>({ corsOrigin, priorityQueueStore, newItemSubscriber, newItemSubscriberChannel, validateOutgoingItem, heartbeatInterval }: {
    corsOrigin: CorsOrigin;
    priorityQueueStore: PriorityQueueStore<TItem, ItemIdentifier>;
    newItemSubscriber: Subscriber<object>;
    newItemSubscriberChannel: string;
    validateOutgoingItem: ({ item }: {
        item: TItem;
    }) => void | Promise<void>;
    heartbeatInterval?: number | undefined;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

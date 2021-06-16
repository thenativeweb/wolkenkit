import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
declare const getV2: <TItem extends object>({ corsOrigin, priorityQueueStore, newItemSubscriber, newItemSubscriberChannel, validateOutgoingItem, heartbeatInterval }: {
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
export { getV2 };

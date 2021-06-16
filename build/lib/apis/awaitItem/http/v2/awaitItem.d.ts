import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Schema } from '../../../../common/elements/Schema';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const awaitItem: {
    description: string;
    path: string;
    request: {};
    response: {
        statusCodes: number[];
        stream: boolean;
        body: Schema;
    };
    getHandler<TItem extends object>({ priorityQueueStore, newItemSubscriber, newItemSubscriberChannel, validateOutgoingItem, heartbeatInterval }: {
        priorityQueueStore: PriorityQueueStore<TItem, ItemIdentifier>;
        newItemSubscriber: Subscriber<object>;
        newItemSubscriberChannel: string;
        validateOutgoingItem: ({ item }: {
            item: TItem;
        }) => void | Promise<void>;
        heartbeatInterval: number;
    }): WolkenkitRequestHandler;
};
export { awaitItem };

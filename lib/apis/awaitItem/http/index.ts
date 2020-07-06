import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { ItemIdentifier } from '../../../common/elements/ItemIdentifier';
import { PriorityQueueStore } from '../../../stores/priorityQueueStore/PriorityQueueStore';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function<TItem> ({
  corsOrigin,
  priorityQueueStore,
  newItemSubscriber,
  newItemSubscriberChannel,
  validateOutgoingItem,
  heartbeatInterval
}: {
  corsOrigin: CorsOrigin;
  priorityQueueStore: PriorityQueueStore<TItem, ItemIdentifier>;
  newItemSubscriber: Subscriber<object>;
  newItemSubscriberChannel: string;
  validateOutgoingItem: ({ item }: { item: TItem }) => void | Promise<void>;
  heartbeatInterval?: number;
}): Promise<{ api: ExpressApplication }> {
  const api = express();

  const v2 = await getV2<TItem>({
    corsOrigin,
    priorityQueueStore,
    newItemSubscriber,
    newItemSubscriberChannel,
    validateOutgoingItem,
    heartbeatInterval
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };

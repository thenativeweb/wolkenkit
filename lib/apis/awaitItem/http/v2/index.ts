import { acknowledge } from './acknowledge';
import { Application } from '../../../../common/application/Application';
import { awaitItem } from './awaitItem';
import { CorsOrigin } from 'get-cors-origin';
import { defer } from './defer';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { renewLock } from './renewLock';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';

const getV2 = async function<TItem, TItemIdentifier extends ItemIdentifier> ({
  application,
  corsOrigin,
  priorityQueueStore,
  newItemSubscriber,
  newItemSubscriberChannel,
  validateOutgoingItem,
  heartbeatInterval = 90_000
}: {
  application: Application;
  corsOrigin: CorsOrigin;
  priorityQueueStore: PriorityQueueStore<TItem, TItemIdentifier>;
  newItemSubscriber: Subscriber<object>;
  newItemSubscriberChannel: string;
  validateOutgoingItem: ({ item }: { item: TItem }) => void | Promise<void>;
  heartbeatInterval?: number;
}): Promise<{ api: ExpressApplication }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }},
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.get(
    `/${awaitItem.path}`,
    awaitItem.getHandler<TItem, TItemIdentifier>({
      priorityQueueStore,
      newItemSubscriber,
      newItemSubscriberChannel,
      validateOutgoingItem,
      heartbeatInterval
    })
  );

  api.post(`/${renewLock.path}`, renewLock.getHandler<TItem, TItemIdentifier>({
    application,
    priorityQueueStore
  }));

  api.post(`/${acknowledge.path}`, acknowledge.getHandler<TItem, TItemIdentifier>({
    application,
    priorityQueueStore
  }));

  api.post(`/${defer.path}`, defer.getHandler<TItem, TItemIdentifier>({
    application,
    priorityQueueStore
  }));

  return { api };
};

export {
  getV2
};

import { Configuration } from './Configuration';
import { getApi as getAwaitItemApi } from '../../../../apis/awaitItem/http';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getPublishMessageApi } from '../../../../apis/publishMessage/http';
import { OnReceiveMessage } from '../../../../apis/publishMessage/OnReceiveMessage';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import express, { Application as ExpressApplication } from 'express';
import { HeapItem, PriorityQueueObserver } from '../../../../stores/priorityQueueStore/Observer/PriorityQueueObserver';

const getApi = async function ({
  configuration,
  priorityQueueStore,
  newItemSubscriber,
  newItemPubSubChannel,
  onReceiveItem
}: {
  configuration: Configuration;
  priorityQueueStore: PriorityQueueObserver;
  newItemSubscriber: Subscriber<object>;
  newItemPubSubChannel: string;
  onReceiveItem: OnReceiveMessage;
}): Promise<{ api: ExpressApplication }> {
  const { api: handleItemApi } = await getPublishMessageApi({
    corsOrigin: getCorsOrigin(configuration.corsOrigin),
    onReceiveMessage: onReceiveItem
  });

  const { api: awaitItemApi } = await getAwaitItemApi<HeapItem>({
    corsOrigin: getCorsOrigin(configuration.corsOrigin),
    priorityQueueStore: priorityQueueStore as any,
    newItemSubscriber,
    newItemSubscriberChannel: newItemPubSubChannel,
    validateOutgoingItem (): void {
      // Intentionally left blank.
    }
  });

  const api = express();

  api.use('/handle-item', handleItemApi);
  api.use('/await-item', awaitItemApi);

  return { api };
};

export { getApi };

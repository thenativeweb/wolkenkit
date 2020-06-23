import { acknowledge } from './acknowledge';
import { Application } from '../../../../common/application/Application';
import { awaitCommandWithMetadata } from './awaitCommandWithMetadata';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { defer } from './defer';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { renewLock } from './renewLock';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';

const getV2 = async function ({
  application,
  corsOrigin,
  priorityQueueStore,
  newCommandSubscriber,
  newCommandSubscriberChannel,
  heartbeatInterval = 90_000
}: {
  application: Application;
  corsOrigin: CorsOrigin;
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;
  newCommandSubscriber: Subscriber<object>;
  newCommandSubscriberChannel: string;
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
    `/${awaitCommandWithMetadata.path}`,
    awaitCommandWithMetadata.getHandler({
      priorityQueueStore,
      newCommandSubscriber,
      newCommandSubscriberChannel,
      heartbeatInterval
    })
  );

  api.post(`/${renewLock.path}`, renewLock.getHandler({
    application,
    priorityQueueStore
  }));

  api.post(`/${acknowledge.path}`, acknowledge.getHandler({
    application,
    priorityQueueStore
  }));

  api.post(`/${defer.path}`, defer.getHandler({
    application,
    priorityQueueStore
  }));

  return { api };
};

export {
  getV2
};

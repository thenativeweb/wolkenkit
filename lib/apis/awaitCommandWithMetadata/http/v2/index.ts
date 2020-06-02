import { acknowledge } from './acknowledge';
import { Application } from 'express';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { awaitCommandWithMetadata } from './awaitCommandWithMetadata';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { defer } from './defer';
import { getApiBase } from '../../../base/getApiBase';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { renewLock } from './renewLock';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';

const getV2 = async function ({
  applicationDefinition,
  corsOrigin,
  priorityQueueStore,
  newCommandSubscriber,
  newCommandSubscriberChannel,
  heartbeatInterval = 90_000
}: {
  applicationDefinition: ApplicationDefinition;
  corsOrigin: CorsOrigin;
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;
  newCommandSubscriber: Subscriber<object>;
  newCommandSubscriberChannel: string;
  heartbeatInterval?: number;
}): Promise<{ api: Application }> {
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
    applicationDefinition,
    priorityQueueStore
  }));

  api.post(`/${acknowledge.path}`, acknowledge.getHandler({
    applicationDefinition,
    priorityQueueStore
  }));

  api.post(`/${defer.path}`, defer.getHandler({
    applicationDefinition,
    priorityQueueStore
  }));

  return { api };
};

export {
  getV2
};

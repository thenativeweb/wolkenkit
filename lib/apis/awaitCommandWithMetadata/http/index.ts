import { Application } from 'express';
import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CommandData } from '../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../common/elements/CommandWithMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { getApiBase } from '../../base/getApiBase';
import { PriorityQueueStore } from '../../../stores/priorityQueueStore/PriorityQueueStore';
import { streamNdjsonMiddleware } from '../../middlewares/streamNdjson';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import * as v2 from './v2';

const getApi = async function ({
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
      body: { parser: { sizeLimit: 100_000 }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.get(
    '/v2/',
    streamNdjsonMiddleware({ heartbeatInterval }),
    v2.awaitCommandWithMetadata({
      priorityQueueStore,
      newCommandSubscriber,
      newCommandSubscriberChannel
    })
  );

  api.post('/v2/renew-lock', v2.renewLock({
    applicationDefinition,
    priorityQueueStore
  }));

  api.post('/v2/acknowledge', v2.acknowledge({
    applicationDefinition,
    priorityQueueStore
  }));

  return { api };
};

export { getApi };

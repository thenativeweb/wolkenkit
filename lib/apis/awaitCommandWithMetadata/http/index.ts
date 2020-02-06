import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CommandData } from '../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../common/elements/CommandWithMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { PriorityQueueStore } from '../../../stores/priorityQueueStore/PriorityQueueStore';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import express, { Application } from 'express';

const getApi = async function ({
  applicationDefinition,
  corsOrigin,
  priorityQueueStore,
  newCommandSubscriber,
  newCommandSubscriberChannel,
  heartbeatInterval
}: {
  applicationDefinition: ApplicationDefinition;
  corsOrigin: CorsOrigin;
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;
  newCommandSubscriber: Subscriber<object>;
  newCommandSubscriberChannel: string;
  heartbeatInterval?: number;
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({
    applicationDefinition,
    corsOrigin,
    priorityQueueStore,
    newCommandSubscriber,
    newCommandSubscriberChannel,
    heartbeatInterval
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };

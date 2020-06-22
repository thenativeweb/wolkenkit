import { Application } from '../../../common/application/Application';
import { CommandData } from '../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../common/elements/CommandWithMetadata';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { ItemIdentifierWithClient } from '../../../common/elements/ItemIdentifierWithClient';
import { PriorityQueueStore } from '../../../stores/priorityQueueStore/PriorityQueueStore';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  application,
  corsOrigin,
  priorityQueueStore,
  newCommandSubscriber,
  newCommandSubscriberChannel,
  heartbeatInterval
}: {
  application: Application;
  corsOrigin: CorsOrigin;
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;
  newCommandSubscriber: Subscriber<object>;
  newCommandSubscriberChannel: string;
  heartbeatInterval?: number;
}): Promise<{ api: ExpressApplication }> {
  const api = express();

  const v2 = await getV2({
    application,
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

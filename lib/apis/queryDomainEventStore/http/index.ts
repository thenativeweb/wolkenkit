import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventStore } from '../../../stores/domainEventStore/DomainEventStore';
import { getApiBase } from '../../base/getApiBase';
import { streamNdjsonMiddleware } from '../../middlewares/streamNdjson';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import * as v2 from './v2';

const getApi = async function ({
  domainEventStore,
  corsOrigin,
  newDomainEventSubscriber,
  newDomainEventSubscriberChannel,
  heartbeatInterval = 90_000
}: {
  domainEventStore: DomainEventStore;
  corsOrigin: CorsOrigin;
  newDomainEventSubscriber: Subscriber<object>;
  newDomainEventSubscriberChannel: string;
  heartbeatInterval?: number;
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: {
        parser: false
      }
    },
    response: {
      headers: { cache: false }
    }
  });

  api.get(
    '/v2/replay',
    streamNdjsonMiddleware({ heartbeatInterval }),
    v2.getReplay({
      domainEventStore,
      newDomainEventSubscriber,
      newDomainEventSubscriberChannel
    })
  );

  api.get(
    '/v2/replay/:aggregateId',
    streamNdjsonMiddleware({ heartbeatInterval }),
    v2.getReplayForAggregate({
      domainEventStore,
      newDomainEventSubscriber,
      newDomainEventSubscriberChannel
    })
  );

  api.get(
    '/v2/last-domain-event',
    v2.getLastDomainEvent({
      domainEventStore
    })
  );

  api.get(
    '/v2/snapshot',
    v2.getSnapshot({
      domainEventStore
    })
  );

  return { api };
};

export { getApi };

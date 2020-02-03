import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getApiBase } from '../../../base/getApiBase';
import { getLastDomainEvent } from './getLastDomainEvent';
import { getReplay } from './getReplay';
import { getReplayForAggregate } from './getReplayForAggregate';
import { getSnapshot } from './getSnapshot';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';

const getV2 = async function ({
  domainEventStore,
  corsOrigin,
  newDomainEventSubscriber,
  newDomainEventSubscriberChannel,
  heartbeatInterval = 90_000
}: {
  domainEventStore: DomainEventStore;
  corsOrigin: CorsOrigin;
  newDomainEventSubscriber: Subscriber<DomainEvent<DomainEventData>>;
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
    '/replay',
    getReplay({
      domainEventStore,
      newDomainEventSubscriber,
      newDomainEventSubscriberChannel,
      heartbeatInterval
    })
  );

  api.get(
    '/replay/:aggregateId',
    getReplayForAggregate({
      domainEventStore,
      newDomainEventSubscriber,
      newDomainEventSubscriberChannel,
      heartbeatInterval
    })
  );

  api.get(
    '/last-domain-event',
    getLastDomainEvent({
      domainEventStore
    })
  );

  api.get(
    '/snapshot',
    getSnapshot({
      domainEventStore
    })
  );

  return { api };
};

export { getV2 };

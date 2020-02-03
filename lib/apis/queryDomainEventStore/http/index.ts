import { CorsOrigin } from 'get-cors-origin';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../stores/domainEventStore/DomainEventStore';
import { getV2 } from './v2';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import express, { Application } from 'express';

const getApi = async function ({
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
  const api = express();

  const v2 = await getV2({
    domainEventStore,
    corsOrigin,
    newDomainEventSubscriber,
    newDomainEventSubscriberChannel,
    heartbeatInterval
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };

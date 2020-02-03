import { CorsOrigin } from 'get-cors-origin';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../stores/domainEventStore/DomainEventStore';
import { getV2 } from './v2';
import { Publisher } from '../../../messaging/pubSub/Publisher';
import express, { Application } from 'express';

const getApi = async function ({
  domainEventStore,
  corsOrigin,
  newDomainEventPublisher,
  newDomainEventPublisherChannel
}: {
  domainEventStore: DomainEventStore;
  corsOrigin: CorsOrigin;
  newDomainEventPublisher: Publisher<DomainEvent<DomainEventData>>;
  newDomainEventPublisherChannel: string;
  heartbeatInterval?: number;
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({
    domainEventStore,
    corsOrigin,
    newDomainEventPublisher,
    newDomainEventPublisherChannel
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };

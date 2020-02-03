import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getApiBase } from '../../../base/getApiBase';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
import { storeDomainEvents } from './storeDomainEvents';
import { storeSnapshot } from './storeSnapshot';

const getV2 = async function ({
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
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.post(
    '/store-domain-events',
    storeDomainEvents({
      domainEventStore,
      newDomainEventPublisher,
      newDomainEventPublisherChannel
    })
  );

  api.post(
    '/store-snapshot',
    storeSnapshot({
      domainEventStore
    })
  );

  return { api };
};

export { getV2 };

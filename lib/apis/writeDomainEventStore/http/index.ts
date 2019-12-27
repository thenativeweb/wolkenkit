import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../stores/domainEventStore/DomainEventStore';
import { getApiBase } from '../../base/getApiBase';
import { Publisher } from '../../../messaging/pubSub/Publisher';
import * as v2 from './v2';

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
    '/v2/store-domain-events',
    v2.storeDomainEvents({
      domainEventStore,
      newDomainEventPublisher,
      newDomainEventPublisherChannel
    })
  );

  api.post(
    '/v2/store-snapshot',
    v2.storeSnapshot({
      domainEventStore
    })
  );

  return { api };
};

export { getApi };

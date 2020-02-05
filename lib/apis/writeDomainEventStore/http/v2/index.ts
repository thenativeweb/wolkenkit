import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getApiBase } from '../../../base/getApiBase';
import { storeDomainEvents } from './storeDomainEvents';
import { storeSnapshot } from './storeSnapshot';

const getV2 = async function ({
  domainEventStore,
  corsOrigin
}: {
  domainEventStore: DomainEventStore;
  corsOrigin: CorsOrigin;
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
      domainEventStore
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

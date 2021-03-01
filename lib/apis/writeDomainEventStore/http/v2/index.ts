import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getApiBase } from '../../../base/getApiBase';
import { getMiddleware as getLoggingMiddleware } from 'flaschenpost';
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
      body: { parser: { sizeLimit: 100_000 }},
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.use(getLoggingMiddleware());

  api.post(
    `/${storeDomainEvents.path}`,
    storeDomainEvents.getHandler({ domainEventStore })
  );

  api.post(
    `/${storeSnapshot.path}`,
    storeSnapshot.getHandler({ domainEventStore })
  );

  return { api };
};

export { getV2 };

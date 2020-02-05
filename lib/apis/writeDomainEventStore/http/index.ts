import { CorsOrigin } from 'get-cors-origin';
import { DomainEventStore } from '../../../stores/domainEventStore/DomainEventStore';
import { getV2 } from './v2';
import express, { Application } from 'express';

const getApi = async function ({
  domainEventStore,
  corsOrigin
}: {
  domainEventStore: DomainEventStore;
  corsOrigin: CorsOrigin;
  heartbeatInterval?: number;
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({
    domainEventStore,
    corsOrigin
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };

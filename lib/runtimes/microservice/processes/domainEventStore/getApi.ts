import { Configuration } from './Configuration';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getQueryDomainEventStoreApi } from '../../../../apis/queryDomainEventStore/http';
import { getApi as getWriteDomainEventStoreApi } from '../../../../apis/writeDomainEventStore/http';
import express, { Application } from 'express';

const getApi = async function ({
  configuration,
  domainEventStore
}: {
  configuration: Configuration;
  domainEventStore: DomainEventStore;
}): Promise<{ api: Application }> {
  const { api: queryDomainEventStoreApi } = await getQueryDomainEventStoreApi({
    corsOrigin: getCorsOrigin(configuration.queryDomainEventsCorsOrigin),
    domainEventStore
  });

  const { api: writeDomainEventStoreApi } = await getWriteDomainEventStoreApi({
    corsOrigin: getCorsOrigin(configuration.writeDomainEventsCorsOrigin),
    domainEventStore
  });

  const api = express();

  api.use('/query', queryDomainEventStoreApi);
  api.use('/write', writeDomainEventStoreApi);

  return { api };
};

export { getApi };

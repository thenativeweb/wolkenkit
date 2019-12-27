import { Configuration } from './Configuration';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHealthApi } from '../../../../apis/getHealth/http';
import { getApi as getQueryDomainEventStoreApi } from '../../../../apis/queryDomainEventStore/http';
import { getApi as getWriteDomainEventStoreApi } from '../../../../apis/writeDomainEventStore/http';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import express, { Application } from 'express';

const getApi = async function ({
  configuration,
  domainEventStore,
  newDomainEventPublisher,
  newDomainEventSubscriber,
  newDomainEventPubSubChannel
}: {
  configuration: Configuration;
  domainEventStore: DomainEventStore;
  newDomainEventPublisher: Publisher<object>;
  newDomainEventSubscriber: Subscriber<object>;
  newDomainEventPubSubChannel: string;
}): Promise<{ api: Application }> {
  const { api: healthApi } = await getHealthApi({
    corsOrigin: getCorsOrigin(configuration.healthCorsOrigin)
  });

  const { api: queryDomainEventStoreApi } = await getQueryDomainEventStoreApi({
    corsOrigin: getCorsOrigin(configuration.queryDomainEventsCorsOrigin),
    domainEventStore,
    newDomainEventSubscriber,
    newDomainEventSubscriberChannel: newDomainEventPubSubChannel
  });

  const { api: writeDomainEventStoreApi } = await getWriteDomainEventStoreApi({
    corsOrigin: getCorsOrigin(configuration.writeDomainEventsCorsOrigin),
    domainEventStore,
    newDomainEventPublisher,
    newDomainEventPublisherChannel: newDomainEventPubSubChannel
  });

  const api = express();

  api.use('/health', healthApi);
  api.use('/query', queryDomainEventStoreApi);
  api.use('/write', writeDomainEventStoreApi);

  return { api };
};

export { getApi };

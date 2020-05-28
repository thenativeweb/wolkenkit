import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getApiBase } from '../../../base/getApiBase';
import { getDomainEventsByCausationId } from './getDomainEventsByCausationId';
import { getDomainEventsByCorrelationId } from './getDomainEventsByCorrelationId';
import { getLastDomainEvent } from './getLastDomainEvent';
import { getReplay } from './getReplay';
import { getReplayForAggregate } from './getReplayForAggregate';
import { getSnapshot } from './getSnapshot';
import { hasDomainEventsWithCausationId } from './hasDomainEventsWithCausationId';

const getV2 = async function ({
  domainEventStore,
  corsOrigin,
  heartbeatInterval = 90_000
}: {
  domainEventStore: DomainEventStore;
  corsOrigin: CorsOrigin;
  heartbeatInterval?: number;
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: false },
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.get(
    `/${getReplay.path}`,
    getReplay.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    `/${getReplayForAggregate.path}`,
    getReplayForAggregate.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    `/${getLastDomainEvent.path}`,
    getLastDomainEvent.getHandler({
      domainEventStore
    })
  );

  api.get(
    `/${getDomainEventsByCausationId.path}`,
    getDomainEventsByCausationId.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    `/${hasDomainEventsWithCausationId.path}`,
    hasDomainEventsWithCausationId.getHandler({
      domainEventStore
    })
  );

  api.get(
    `/${getDomainEventsByCorrelationId.path}`,
    getDomainEventsByCorrelationId.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    `/${getSnapshot.path}`,
    getSnapshot.getHandler({
      domainEventStore
    })
  );

  return { api };
};

export { getV2 };

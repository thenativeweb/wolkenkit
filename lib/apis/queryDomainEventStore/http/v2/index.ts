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
      body: {
        parser: false
      }
    },
    response: {
      headers: { cache: false }
    }
  });

  api.get(
    '/replay',
    getReplay({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    '/replay/:aggregateId',
    getReplayForAggregate({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    '/last-domain-event',
    getLastDomainEvent({
      domainEventStore
    })
  );

  api.get(
    '/domain-events-by-causation-id',
    getDomainEventsByCausationId({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    '/has-domain-events-with-causation-id',
    hasDomainEventsWithCausationId({
      domainEventStore
    })
  );

  api.get(
    '/domain-events-by-correlation-id',
    getDomainEventsByCorrelationId({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    '/snapshot',
    getSnapshot({
      domainEventStore
    })
  );

  return { api };
};

export { getV2 };

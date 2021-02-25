import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getAggregateIdentifiers } from './getAggregateIdentifiers';
import { getAggregateIdentifiersByName } from './getAggregateIdentifiersByName';
import { getApiBase } from '../../../base/getApiBase';
import { getDomainEventsByCausationId } from './getDomainEventsByCausationId';
import { getDomainEventsByCorrelationId } from './getDomainEventsByCorrelationId';
import { getLastDomainEvent } from './getLastDomainEvent';
import { getMiddleware as getLoggingMiddleware } from 'flaschenpost';
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

  const loggingOnResponseMiddleware = getLoggingMiddleware();
  const loggingOnRequestMiddleware = getLoggingMiddleware({ logOn: 'request' });

  api.get(
    `/${getReplay.path}`,
    loggingOnRequestMiddleware,
    getReplay.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    `/${getReplayForAggregate.path}`,
    loggingOnRequestMiddleware,
    getReplayForAggregate.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    `/${getLastDomainEvent.path}`,
    loggingOnResponseMiddleware,
    getLastDomainEvent.getHandler({
      domainEventStore
    })
  );

  api.get(
    `/${getDomainEventsByCausationId.path}`,
    loggingOnRequestMiddleware,
    getDomainEventsByCausationId.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    `/${hasDomainEventsWithCausationId.path}`,
    loggingOnResponseMiddleware,
    hasDomainEventsWithCausationId.getHandler({
      domainEventStore
    })
  );

  api.get(
    `/${getDomainEventsByCorrelationId.path}`,
    loggingOnRequestMiddleware,
    getDomainEventsByCorrelationId.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    `/${getSnapshot.path}`,
    loggingOnResponseMiddleware,
    getSnapshot.getHandler({
      domainEventStore
    })
  );

  api.get(
    `/${getAggregateIdentifiers.path}`,
    loggingOnRequestMiddleware,
    getAggregateIdentifiers.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  api.get(
    `/${getAggregateIdentifiersByName.path}`,
    loggingOnRequestMiddleware,
    getAggregateIdentifiersByName.getHandler({
      domainEventStore,
      heartbeatInterval
    })
  );

  return { api };
};

export { getV2 };

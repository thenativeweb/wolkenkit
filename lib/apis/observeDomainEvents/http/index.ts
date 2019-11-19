import { Application } from 'express';
import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CorsOrigin } from '../../base/CorsOrigin';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../common/elements/DomainEventWithState';
import { EventEmitter } from 'events';
import { getApiBase } from '../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../base/getAuthenticationMiddleware';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { State } from '../../../common/elements/State';
import * as v2 from './v2';

const getApi = async function ({
  corsOrigin,
  applicationDefinition,
  repository,
  identityProviders,
  heartbeatInterval = 90_000
}: {
  corsOrigin: CorsOrigin;
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
  identityProviders: IdentityProvider[];
  heartbeatInterval?: number;
}): Promise<{ api: Application; publishDomainEvent: PublishDomainEvent }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: false }
    },
    response: {
      headers: { cache: false }
    }
  });

  const authenticationMiddleware = await getAuthenticationMiddleware({
    identityProviders
  });

  const domainEventEmitter = new EventEmitter();

  api.get('/v2/description', v2.getDescription({
    applicationDefinition
  }));

  api.get('/', authenticationMiddleware, v2.getDomainEvents({
    heartbeatInterval,
    repository
  }));

  const publishDomainEvent = function ({ domainEvent }: {
    domainEvent: DomainEventWithState<DomainEventData, State>;
  }): void {
    domainEventEmitter.emit('domain-event', domainEvent);
  };

  return { api, publishDomainEvent };
};

export { getApi };

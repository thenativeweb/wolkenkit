import { Application } from 'express';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getDescription } from './getDescription';
import { getDomainEvents } from './getDomainEvents';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../../PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';

const getV2 = async function ({
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

  const domainEventEmitter =
    new SpecializedEventEmitter<DomainEventWithState<DomainEventData, State>>();

  api.get('/description', getDescription({
    applicationDefinition
  }));

  api.get(
    '/',
    authenticationMiddleware,
    streamNdjsonMiddleware({ heartbeatInterval }),
    getDomainEvents({
      applicationDefinition,
      domainEventEmitter,
      repository
    })
  );

  const publishDomainEvent: PublishDomainEvent = function ({ domainEvent }): void {
    validateDomainEventWithState({ domainEvent, applicationDefinition });

    domainEventEmitter.emit(domainEvent);
  };

  return { api, publishDomainEvent };
};

export { getV2 };

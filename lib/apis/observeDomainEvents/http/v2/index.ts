import { Application } from 'express';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getDescription } from './getDescription';
import { getDomainEvents } from './getDomainEvents';
import { getDomainEventWithStateSchema } from '../../../../common/schemas/getDomainEventWithStateSchema';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../../PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { State } from '../../../../common/elements/State';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';
import { Value } from 'validate-value';

const domainEventWithStateSchema = new Value(getDomainEventWithStateSchema());

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
      body: { parser: false },
      query: { parser: { useJson: true }}
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

  api.get(`/${getDescription.path}`, getDescription.getHandler({
    applicationDefinition
  }));

  api.get(
    `/${getDomainEvents.path}`,
    authenticationMiddleware,
    getDomainEvents.getHandler({
      applicationDefinition,
      domainEventEmitter,
      repository,
      heartbeatInterval
    })
  );

  const publishDomainEvent: PublishDomainEvent = function ({ domainEvent }): void {
    try {
      domainEventWithStateSchema.validate(domainEvent, { valueName: 'domainEvent' });
    } catch (ex) {
      throw new errors.DomainEventMalformed(ex.message);
    }
    validateDomainEventWithState({ domainEvent, applicationDefinition });

    domainEventEmitter.emit(domainEvent);
  };

  return { api, publishDomainEvent };
};

export { getV2 };

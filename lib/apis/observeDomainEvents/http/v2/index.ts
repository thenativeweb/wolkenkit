import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { getAuthenticationMiddleware } from '../../../base/getAuthenticationMiddleware';
import { getDescription } from './getDescription';
import { getDomainEvents } from './getDomainEvents';
import { getDomainEventWithStateSchema } from '../../../../common/schemas/getDomainEventWithStateSchema';
import { getMiddleware as getLoggingMiddleware } from 'flaschenpost';
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
  application,
  repository,
  identityProviders,
  heartbeatInterval = 90_000
}: {
  corsOrigin: CorsOrigin;
  application: Application;
  repository: Repository;
  identityProviders: IdentityProvider[];
  heartbeatInterval?: number;
}): Promise<{ api: ExpressApplication; publishDomainEvent: PublishDomainEvent }> {
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

  api.get(
    `/${getDescription.path}`,
    getLoggingMiddleware(),
    getDescription.getHandler({
      application
    })
  );

  api.get(
    `/${getDomainEvents.path}`,
    getLoggingMiddleware({ logOn: 'request' }),
    authenticationMiddleware,
    getDomainEvents.getHandler({
      application,
      domainEventEmitter,
      repository,
      heartbeatInterval
    })
  );

  const publishDomainEvent: PublishDomainEvent = function ({ domainEvent }): void {
    try {
      domainEventWithStateSchema.validate(domainEvent, { valueName: 'domainEvent' });
    } catch (ex: unknown) {
      throw new errors.DomainEventMalformed((ex as Error).message);
    }
    validateDomainEventWithState({ domainEvent, application });

    domainEventEmitter.emit(domainEvent);
  };

  return { api, publishDomainEvent };
};

export { getV2 };

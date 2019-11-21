import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHealthApi } from '../../../../apis/getHealth/http';
import { getApi as getObserveDomainEventsApi } from '../../../../apis/observeDomainEvents/http';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import express, { Application } from 'express';

const getPublicApi = async function ({
  environmentVariables,
  applicationDefinition,
  identityProviders,
  repository
}: {
  environmentVariables: Record<string, any>;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
  repository: Repository;
}): Promise<{ api: Application; publishDomainEvent: PublishDomainEvent }> {
  const { api: healthApi } = await getHealthApi({
    corsOrigin: getCorsOrigin(environmentVariables.HEALTH_CORS_ORIGIN)
  });

  const { api: observeDomainEventsApi, publishDomainEvent } = await getObserveDomainEventsApi({
    corsOrigin: getCorsOrigin(environmentVariables.DOMAINEVENT_CORS_ORIGIN),
    applicationDefinition,
    identityProviders,
    repository
  });

  const api = express();

  api.use('/health', healthApi);
  api.use('/domain-events', observeDomainEventsApi);

  return { api, publishDomainEvent };
};

export { getPublicApi };

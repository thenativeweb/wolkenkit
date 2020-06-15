import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getObserveDomainEventsApi } from '../../../../apis/observeDomainEvents/http';
import { getApi as getOpenApiApi } from '../../../../apis/openApi/http';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import express, { Application } from 'express';

const getApi = async function ({
  configuration,
  applicationDefinition,
  identityProviders,
  repository
}: {
  configuration: Configuration;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
  repository: Repository;
}): Promise<{ api: Application; publishDomainEvent: PublishDomainEvent }> {
  const corsOrigin = getCorsOrigin(configuration.domainEventCorsOrigin);

  const { api: observeDomainEventsApi, publishDomainEvent, getApiDefinitions: getObserveDomainApiDefinitions } =
      await getObserveDomainEventsApi({
        corsOrigin,
        applicationDefinition,
        identityProviders,
        repository
      });

  const api = express();

  api.use('/domain-events', observeDomainEventsApi);

  if (configuration.enableOpenApiDocumentation) {
    const { api: openApiApi } = await getOpenApiApi({
      corsOrigin,
      title: 'Domain Event server API',
      schemes: [ 'http' ],
      apis: [
        ...getObserveDomainApiDefinitions('domain-events')
      ]
    });

    api.use('/docs', openApiApi);
  }

  return { api, publishDomainEvent };
};

export { getApi };

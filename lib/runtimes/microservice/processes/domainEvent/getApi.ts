import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { flaschenpost } from 'flaschenpost';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getObserveDomainEventsApi } from '../../../../apis/observeDomainEvents/http';
import { getApi as getOpenApiApi } from '../../../../apis/openApi/http';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import express, { Application as ExpressApplication } from 'express';

const logger = flaschenpost.getLogger();

const getApi = async function ({
  configuration,
  application,
  identityProviders,
  repository
}: {
  configuration: Configuration;
  application: Application;
  identityProviders: IdentityProvider[];
  repository: Repository;
}): Promise<{ api: ExpressApplication; publishDomainEvent: PublishDomainEvent }> {
  const corsOrigin = getCorsOrigin(configuration.domainEventCorsOrigin);

  const { api: observeDomainEventsApi, publishDomainEvent, getApiDefinitions: getObserveDomainApiDefinitions } =
      await getObserveDomainEventsApi({
        corsOrigin,
        application,
        identityProviders,
        repository,
        heartbeatInterval: configuration.heartbeatInterval
      });

  const api = express();

  api.use('/domain-events', observeDomainEventsApi);

  if (configuration.enableOpenApiDocumentation) {
    logger.info(
      'Open api endpoint is enabled.',
      withLogMetadata('runtime', 'microservice/domainEvent')
    );

    const { api: openApiApi } = await getOpenApiApi({
      corsOrigin,
      application,
      title: 'Domain event server API',
      schemes: [ 'http' ],
      apis: [
        ...getObserveDomainApiDefinitions('domain-events')
      ]
    });

    api.use('/open-api', openApiApi);
  }

  return { api, publishDomainEvent };
};

export { getApi };

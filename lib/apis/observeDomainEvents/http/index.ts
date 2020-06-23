import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getApiDefinitions } from './getApiDefinitions';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
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
}): Promise<{ api: ExpressApplication; publishDomainEvent: PublishDomainEvent; getApiDefinitions: (basePath: string) => ApiDefinition[] }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    application,
    repository,
    identityProviders,
    heartbeatInterval
  });

  api.use('/v2', v2.api);

  const publishDomainEvent: PublishDomainEvent = function ({ domainEvent }): void {
    v2.publishDomainEvent({ domainEvent });
  };

  return {
    api,
    publishDomainEvent,
    getApiDefinitions: (basePath: string): ApiDefinition[] => getApiDefinitions({ basePath })
  };
};

export { getApi };

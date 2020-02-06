import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import express, { Application } from 'express';

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
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    applicationDefinition,
    repository,
    identityProviders,
    heartbeatInterval
  });

  api.use('/v2', v2.api);

  const publishDomainEvent: PublishDomainEvent = function ({ domainEvent }): void {
    v2.publishDomainEvent({ domainEvent });
  };

  return { api, publishDomainEvent };
};

export { getApi };

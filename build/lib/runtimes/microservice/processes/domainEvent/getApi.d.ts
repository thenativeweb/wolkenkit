import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ configuration, application, identityProviders, repository }: {
    configuration: Configuration;
    application: Application;
    identityProviders: IdentityProvider[];
    repository: Repository;
}) => Promise<{
    api: ExpressApplication;
    publishDomainEvent: PublishDomainEvent;
}>;
export { getApi };

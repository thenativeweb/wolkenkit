import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../../PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
declare const getV2: ({ corsOrigin, application, repository, identityProviders, heartbeatInterval }: {
    corsOrigin: CorsOrigin;
    application: Application;
    repository: Repository;
    identityProviders: IdentityProvider[];
    heartbeatInterval: number;
}) => Promise<{
    api: ExpressApplication;
    publishDomainEvent: PublishDomainEvent;
}>;
export { getV2 };

import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getApiDefinitions } from './getApiDefinitions';
import { IdentityProvider } from 'limes';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ corsOrigin, application, repository, identityProviders, heartbeatInterval }: {
    corsOrigin: CorsOrigin;
    application: Application;
    repository: Repository;
    identityProviders: IdentityProvider[];
    heartbeatInterval: number;
}) => Promise<{
    api: ExpressApplication;
    publishDomainEvent: PublishDomainEvent;
    getApiDefinitions: (basePath: string) => ApiDefinition[];
}>;
export { getApi };

import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getApiDefinitions } from './getApiDefinitions';
import { IdentityProvider } from 'limes';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ application, corsOrigin, identityProviders }: {
    application: Application;
    corsOrigin: CorsOrigin;
    identityProviders: IdentityProvider[];
}) => Promise<{
    api: ExpressApplication;
    getApiDefinitions: (basePath: string) => ApiDefinition[];
}>;
export { getApi };

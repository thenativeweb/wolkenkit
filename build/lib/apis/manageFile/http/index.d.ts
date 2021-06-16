import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { FileStore } from '../../../stores/fileStore/FileStore';
import { getApiDefinitions } from './getApiDefinitions';
import { IdentityProvider } from 'limes';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ application, corsOrigin, identityProviders, fileStore }: {
    application: Application;
    corsOrigin: CorsOrigin;
    identityProviders: IdentityProvider[];
    fileStore: FileStore;
}) => Promise<{
    api: ExpressApplication;
    getApiDefinitions: (basePath: string) => ApiDefinition[];
}>;
export { getApi };

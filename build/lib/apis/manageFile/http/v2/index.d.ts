import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { IdentityProvider } from 'limes';
declare const getV2: ({ application, corsOrigin, identityProviders, fileStore }: {
    application: Application;
    corsOrigin: CorsOrigin;
    identityProviders: IdentityProvider[];
    fileStore: FileStore;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getV2 };

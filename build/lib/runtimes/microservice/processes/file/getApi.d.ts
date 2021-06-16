import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { IdentityProvider } from 'limes';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ configuration, application, identityProviders, fileStore }: {
    configuration: Configuration;
    application: Application;
    identityProviders: IdentityProvider[];
    fileStore: FileStore;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

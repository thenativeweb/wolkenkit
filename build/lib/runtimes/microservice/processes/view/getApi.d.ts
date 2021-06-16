import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { IdentityProvider } from 'limes';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ application, configuration, identityProviders }: {
    application: Application;
    configuration: Configuration;
    identityProviders: IdentityProvider[];
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

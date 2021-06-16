import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { IdentityProvider } from 'limes';
declare const getV2: ({ application, corsOrigin, identityProviders }: {
    application: Application;
    corsOrigin: CorsOrigin;
    identityProviders: IdentityProvider[];
}) => Promise<{
    api: ExpressApplication;
}>;
export { getV2 };

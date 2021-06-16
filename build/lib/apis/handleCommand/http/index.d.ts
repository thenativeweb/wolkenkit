import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getApiDefinitions } from './getApiDefinitions';
import { IdentityProvider } from 'limes';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ corsOrigin, onReceiveCommand, onCancelCommand, application, identityProviders }: {
    corsOrigin: CorsOrigin;
    onReceiveCommand: OnReceiveCommand;
    onCancelCommand: OnCancelCommand;
    application: Application;
    identityProviders: IdentityProvider[];
}) => Promise<{
    api: ExpressApplication;
    getApiDefinitions: (basePath: string) => ApiDefinition[];
}>;
export { getApi };

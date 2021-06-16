import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { IdentityProvider } from 'limes';
import { OnCancelCommand } from '../../OnCancelCommand';
import { OnReceiveCommand } from '../../OnReceiveCommand';
declare const getV2: ({ corsOrigin, onReceiveCommand, onCancelCommand, application, identityProviders }: {
    corsOrigin: CorsOrigin;
    onReceiveCommand: OnReceiveCommand;
    onCancelCommand: OnCancelCommand;
    application: Application;
    identityProviders: IdentityProvider[];
}) => Promise<{
    api: ExpressApplication;
}>;
export { getV2 };

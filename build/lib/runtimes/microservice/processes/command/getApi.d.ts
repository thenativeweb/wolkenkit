import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { IdentityProvider } from 'limes';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ configuration, application, identityProviders, onReceiveCommand, onCancelCommand }: {
    configuration: Configuration;
    application: Application;
    identityProviders: IdentityProvider[];
    onReceiveCommand: OnReceiveCommand;
    onCancelCommand: OnCancelCommand;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

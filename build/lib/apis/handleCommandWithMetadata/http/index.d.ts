import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ corsOrigin, onReceiveCommand, onCancelCommand, application }: {
    corsOrigin: CorsOrigin;
    onReceiveCommand: OnReceiveCommand;
    onCancelCommand: OnCancelCommand;
    application: Application;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

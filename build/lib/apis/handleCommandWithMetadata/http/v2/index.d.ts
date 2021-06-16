import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { OnCancelCommand } from '../../OnCancelCommand';
import { OnReceiveCommand } from '../../OnReceiveCommand';
declare const getV2: ({ corsOrigin, onReceiveCommand, onCancelCommand, application }: {
    corsOrigin: CorsOrigin;
    onReceiveCommand: OnReceiveCommand;
    onCancelCommand: OnCancelCommand;
    application: Application;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getV2 };

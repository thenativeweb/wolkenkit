import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { OnReceiveDomainEvent } from '../OnReceiveDomainEvent';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ corsOrigin, onReceiveDomainEvent, application }: {
    corsOrigin: CorsOrigin;
    onReceiveDomainEvent: OnReceiveDomainEvent;
    application: Application;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
declare const getV2: ({ corsOrigin, onReceiveDomainEvent, application }: {
    corsOrigin: CorsOrigin;
    onReceiveDomainEvent: OnReceiveDomainEvent;
    application: Application;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getV2 };

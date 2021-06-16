import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { PerformReplay } from '../../../common/domain/PerformReplay';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ corsOrigin, performReplay, application }: {
    corsOrigin: CorsOrigin;
    performReplay: PerformReplay;
    application: Application;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

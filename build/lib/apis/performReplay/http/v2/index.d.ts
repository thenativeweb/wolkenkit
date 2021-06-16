import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { PerformReplay } from '../../../../common/domain/PerformReplay';
declare const getV2: ({ corsOrigin, performReplay, application }: {
    corsOrigin: CorsOrigin;
    performReplay: PerformReplay;
    application: Application;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getV2 };

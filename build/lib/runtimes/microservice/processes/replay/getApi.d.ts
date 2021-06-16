import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { PerformReplay } from '../../../../common/domain/PerformReplay';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ configuration, application, performReplay }: {
    configuration: Configuration;
    application: Application;
    performReplay: PerformReplay;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

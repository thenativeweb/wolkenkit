import { Application } from './Application';
import { ApplicationDescription } from './ApplicationDescription';
declare const getApplicationDescription: ({ application }: {
    application: Application;
}) => ApplicationDescription;
export { getApplicationDescription };

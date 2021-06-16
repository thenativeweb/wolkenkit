import { ApiDefinition } from '../ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ corsOrigin, application, title, version, description, schemes, basePath, tags, apis }: {
    corsOrigin: CorsOrigin;
    application: Application;
    title: string;
    version?: string | undefined;
    description?: string | undefined;
    schemes?: string[] | undefined;
    basePath?: string | undefined;
    tags?: string[] | undefined;
    apis: ApiDefinition[];
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };

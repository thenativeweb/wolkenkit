import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
declare const getApiDefinitions: ({ application, basePath }: {
    application: Application;
    basePath: string;
}) => ApiDefinition[];
export { getApiDefinitions };

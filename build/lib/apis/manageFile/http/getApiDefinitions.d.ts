import { ApiDefinition } from '../../openApi/ApiDefinition';
declare const getApiDefinitions: ({ basePath }: {
    basePath: string;
}) => ApiDefinition[];
export { getApiDefinitions };

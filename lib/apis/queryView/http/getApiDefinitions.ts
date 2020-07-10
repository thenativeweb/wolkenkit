import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';

const getApiDefinitions = function ({ application, basePath }: {
  application: Application;
  basePath: string;
}): ApiDefinition[] {
  const apiDefinitions: ApiDefinition[] = [];

  const v2ApiDefinition: ApiDefinition = {
    basePath: `${basePath}/v2`,
    routes: {
      get: [],
      post: []
    },
    tags: [ 'Views' ]
  };

  // TODO: generate api definitions based on views and query handlers

  apiDefinitions.push(v2ApiDefinition);

  return apiDefinitions;
};

export { getApiDefinitions };

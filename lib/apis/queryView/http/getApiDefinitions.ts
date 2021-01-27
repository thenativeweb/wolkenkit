import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { queryStream } from './v2/queryStream';

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

  for (const [ viewName, viewDefinition ] of Object.entries(application.views)) {
    for (const [ queryHandlerName, queryDefinition ] of Object.entries(viewDefinition.queryHandlers)) {
      v2ApiDefinition.routes.get.push({
        path: `${viewName}/${queryDefinition.type}/${queryHandlerName}`,
        description: queryDefinition.getDocumentation ? queryDefinition.getDocumentation() : queryStream.description,
        request: {
          query: queryDefinition.getOptionsSchema ? queryDefinition.getOptionsSchema() : queryStream.request.query
        },
        response: {
          statusCodes: queryStream.response.statusCodes,
          stream: queryDefinition.type === 'stream',
          body: queryDefinition.getResultItemSchema ? queryDefinition.getResultItemSchema() : {}
        }
      });
    }
  }

  apiDefinitions.push(v2ApiDefinition);

  return apiDefinitions;
};

export { getApiDefinitions };

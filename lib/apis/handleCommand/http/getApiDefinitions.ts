import { ApiDefinition } from '../../openApi/ApiDefinition';
import { Application } from '../../../common/application/Application';
import { getDescription } from './v2/getDescription';
import { postCommand } from './v2/postCommand';

const getApiDefinitions = function ({ application, basePath }: {
  application: Application;
  basePath: string;
}): ApiDefinition[] {
  const apiDefinitions: ApiDefinition[] = [];

  const v2ApiDefinition: ApiDefinition = {
    basePath: `${basePath}/v2`,
    routes: {
      get: [
        getDescription
      ],
      post: []
    },
    tags: [ 'Commands' ]
  };

  for (const [ contextName, contextDefinition ] of Object.entries(application.domain)) {
    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      for (const [ commandName, commandHandler ] of Object.entries(aggregateDefinition.commandHandlers)) {
        v2ApiDefinition.routes.post.push({
          path: `${contextName}/${aggregateName}/:aggregateId/${commandName}`,
          description: commandHandler.getDocumentation ? commandHandler.getDocumentation() : postCommand.description,
          request: {
            body: commandHandler.getSchema ? commandHandler.getSchema() : { type: 'object' }
          },
          response: postCommand.response
        });
      }
    }
  }

  apiDefinitions.push(v2ApiDefinition);

  return apiDefinitions;
};

export { getApiDefinitions };

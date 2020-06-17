import { ApiDefinition } from '../../openApi/ApiDefinition';
import { getDescription } from './v2/getDescription';
import { getDomainEvents } from './v2/getDomainEvents';

const getApiDefinitions = function ({ basePath }: {
  basePath: string;
}): ApiDefinition[] {
  return [{
    basePath: `${basePath}/v2`,
    routes: {
      get: [
        getDescription,
        getDomainEvents
      ],
      post: []
    },
    tags: [ 'Domain events' ]
  }];
};

export { getApiDefinitions };

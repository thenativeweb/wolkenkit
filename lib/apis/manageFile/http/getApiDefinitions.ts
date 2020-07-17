import { ApiDefinition } from '../../openApi/ApiDefinition';
import { getFile } from './v2/getFile';
import { postAddFile } from './v2/postAddFile';
import { postRemoveFile } from './v2/postRemoveFile';

const getApiDefinitions = function ({ basePath }: {
  basePath: string;
}): ApiDefinition[] {
  const apiDefinitions: ApiDefinition[] = [];

  const v2ApiDefinition: ApiDefinition = {
    basePath: `${basePath}/v2`,
    routes: {
      get: [
        {
          path: getFile.path,
          description: getFile.description,
          request: {},
          response: getFile.response
        }
      ],
      post: [
        {
          path: postAddFile.path,
          description: postAddFile.description,
          request: {
            headers: postAddFile.request.headers,
            body: {}
          },
          response: postAddFile.response
        },
        {
          path: postRemoveFile.path,
          description: postRemoveFile.description,
          request: {
            body: postRemoveFile.request.body
          },
          response: postRemoveFile.response
        }
      ]
    },
    tags: [ 'Files' ]
  };

  apiDefinitions.push(v2ApiDefinition);

  return apiDefinitions;
};

export { getApiDefinitions };

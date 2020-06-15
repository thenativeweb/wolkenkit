import { addRouteToPaths } from '../addRouteToPaths';
import { ApiDefinition } from '../ApiDefinition';
import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { flaschenpost } from 'flaschenpost';
import { getApiBase } from '../../base/getApiBase';
import swaggerUi from 'swagger-ui-express';

const logger = flaschenpost.getLogger();

const getApi = async function ({
  corsOrigin,
  title,
  version,
  description,
  schemes = [ 'https' ],
  basePath = '/',
  tags = [],
  apis
}: {
  corsOrigin: CorsOrigin;
  title: string;
  version?: string;
  description?: string;
  schemes?: string[];
  basePath?: string;
  tags?: string[];
  apis: ApiDefinition[];
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }},
      query: { parser: { useJson: false }}
    },
    response: {
      headers: { cache: false }
    }
  });

  const paths: any = {};

  for (const apiDefinition of apis) {
    for (const route of apiDefinition.routes.get) {
      addRouteToPaths({ route, method: 'get', basePath: apiDefinition.basePath, paths });
    }
    for (const route of apiDefinition.routes.post) {
      addRouteToPaths({ route, method: 'post', basePath: apiDefinition.basePath, paths });
    }
  }

  const openApiDefinition = {
    openapi: '3.0.3',
    info: {
      title,
      version,
      description
    },
    schemes,
    basePath,
    tags: tags.map((tag): any => ({ name: tag })),
    paths
  };

  logger.debug('Constructed openApi definition for documentation route', { openApiDefinition });

  api.use('/', swaggerUi.serve, swaggerUi.setup(openApiDefinition));

  return { api };
};

export { getApi };

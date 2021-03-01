import { addRouteToPaths } from '../addRouteToPaths';
import { ApiDefinition } from '../ApiDefinition';
import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../base/getApiBase';
import { getApi as getStaticApi } from '../../getStatic/http';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { withLogMetadata } from '../../../common/utils/logging/withLogMetadata';
import { flaschenpost, getMiddleware as getLoggingMiddleware } from 'flaschenpost';

const logger = flaschenpost.getLogger();

const getApi = async function ({
  corsOrigin,
  application,
  title,
  version,
  description,
  schemes = [ 'https' ],
  basePath = '/',
  tags = [],
  apis
}: {
  corsOrigin: CorsOrigin;
  application: Application;
  title: string;
  version?: string;
  description?: string;
  schemes?: string[];
  basePath?: string;
  tags?: string[];
  apis: ApiDefinition[];
}): Promise<{ api: ExpressApplication }> {
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
      addRouteToPaths({ route, method: 'get', basePath: apiDefinition.basePath, tags: apiDefinition.tags, paths });
    }
    for (const route of apiDefinition.routes.post) {
      addRouteToPaths({ route, method: 'post', basePath: apiDefinition.basePath, tags: apiDefinition.tags, paths });
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

  logger.debug(
    'Constructed openApi definition for documentation route.',
    withLogMetadata('api', 'openApi', { openApiDefinition })
  );

  const { api: staticApi } = await getStaticApi({
    directory: path.join(__dirname, '..', '..', '..', '..', 'assets'),
    corsOrigin
  });

  api.use(getLoggingMiddleware());

  api.use('/assets', staticApi);
  api.use('/', swaggerUi.serve, swaggerUi.setup(
    openApiDefinition,
    {
      customfavIcon: 'assets/favicon.png',
      customSiteTitle: `${application.packageManifest.name} | API documentation`,
      customCssUrl: 'assets/style.css'
    }
  ));

  return { api };
};

export { getApi };

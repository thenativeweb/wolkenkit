import { getOpenApiPathFromExpressPath } from './getOpenApiPathFromExpressPath';
import http from 'http';
import { RouteDefinition } from './RouteDefinition';

const addRouteToPaths = function ({ route, method, basePath, tags, paths }: {
  route: RouteDefinition;
  method: 'get' | 'post';
  basePath: string;
  tags: string[];
  paths: any;
}): void {
  const path = `/${basePath}/${getOpenApiPathFromExpressPath({ expressPath: route.path })}`;

  const routeObject: any = {
    [method]: {
      summary: route.description,
      parameters: [],
      responses: {},
      tags
    }
  };

  for (const pathSegment of route.path.split('/')) {
    if (!pathSegment.startsWith(':')) {
      continue;
    }

    routeObject[method].parameters.push({
      name: pathSegment.slice(1),
      in: 'path',
      required: true,
      type: 'string'
    });
  }

  if (route.request.query && route.request.query.properties) {
    for (const [ queryParameterName, queryParameterSchema ] of Object.entries(route.request.query.properties)) {
      routeObject[method].parameters.push({
        name: queryParameterName,
        in: 'query',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        required: (route.request.query.required || []).includes(queryParameterName),
        schema: queryParameterSchema
      });
    }
  }

  if (route.request.body) {
    routeObject[method].requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: route.request.body
        }
      }
    };
  }

  for (const statusCode of route.response.statusCodes) {
    routeObject[method].responses[statusCode] = {
      description: http.STATUS_CODES[statusCode]
    };
  }

  if (route.response.body) {
    let contentType = 'application/json';

    if (route.response.stream) {
      contentType = 'application/x-ndjson';
    }

    routeObject[method].responses[200].content = {
      [contentType]: {
        schema: route.response.body
      }
    };
  }

  // eslint-disable-next-line no-param-reassign
  paths[path] = routeObject;
};

export { addRouteToPaths };

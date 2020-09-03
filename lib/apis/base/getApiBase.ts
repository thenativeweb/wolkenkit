import bodyParser from 'body-parser';
import cors from 'cors';
import { flaschenpost, MorganPlugin } from 'flaschenpost';
import { GetApiBaseParameters } from './GetApiBaseParameters';
import helmet from 'helmet';
import { jsonQueryParserMiddleware } from './jsonQueryParserMiddleware';
import morgan from 'morgan';
import nocache from 'nocache';
import { streamNdjsonMiddleware } from './streamNdjsonMiddleware';
import express, { Application, Request } from 'express';

const logger = flaschenpost.getLogger();

const getApiBase = async function ({ request, response }: GetApiBaseParameters): Promise<Application> {
  const api = express();

  const helmetOptions: any = {};

  if (request.headers.csp === false) {
    helmetOptions.contentSecurityPolicy = false;
  }

  api.use(helmet(helmetOptions));

  if (request.headers.cors) {
    api.options('*', cors<Request>({
      methods: [ 'GET', 'POST' ],
      origin: request.headers.cors.origin,
      allowedHeaders: request.headers.cors.allowedHeaders,
      exposedHeaders: request.headers.cors.exposedHeaders,
      optionsSuccessStatus: 200
    }));
    api.use(cors({
      methods: [ 'GET', 'POST' ],
      origin: request.headers.cors.origin,
      allowedHeaders: request.headers.cors.allowedHeaders,
      exposedHeaders: request.headers.cors.exposedHeaders,
      optionsSuccessStatus: 200
    }));
  }

  const morganPlugin = new MorganPlugin('debug');

  api.use(morgan('short', { stream: morganPlugin }));

  if (!response.headers.cache) {
    api.use(nocache());
  }

  if (request.query.parser.useJson) {
    api.use(jsonQueryParserMiddleware);
  }

  if (request.body.parser) {
    api.use(bodyParser.json({ limit: request.body.parser.sizeLimit }));
  }

  api.use(streamNdjsonMiddleware);

  return api;
};

export { getApiBase };

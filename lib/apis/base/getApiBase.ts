import bodyParser from 'body-parser';
import cors from 'cors';
import { GetApiBaseParameters } from './GetApiBaseParameters';
import nocache from 'nocache';
import express, { Application } from 'express';

const getApiBase = async function ({ request, response }: GetApiBaseParameters): Promise<Application> {
  const api = express();

  if (request.headers.cors) {
    api.options('*', cors({
      methods: [ 'GET', 'POST' ],
      origin: request.headers.cors.origin,
      optionsSuccessStatus: 200
    }));
    api.use(cors({
      methods: [ 'GET', 'POST' ],
      origin: request.headers.cors.origin,
      optionsSuccessStatus: 200
    }));
  }

  if (!response.headers.cache) {
    api.use(nocache());
  }

  if (request.body.parser) {
    api.use(bodyParser.json({ limit: request.body.parser.sizeLimit }));
  }

  return api;
};

export { getApiBase };

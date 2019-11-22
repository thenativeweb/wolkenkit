import compression from 'compression';
import { CorsOrigin } from 'get-cors-origin';
import { errors } from '../../../common/errors';
import { exists } from '../../../common/utils/fs/exists';
import fs from 'fs';
import { getApiBase } from '../../base/getApiBase';
import express, { Application } from 'express';

const getApi = async function ({ corsOrigin, directory }: {
  corsOrigin: CorsOrigin;
  directory: string;
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: false }
    },
    response: {
      headers: { cache: false }
    }
  });

  if (!await exists({ path: directory })) {
    throw new errors.DirectoryNotFound(`Directory '${directory}' not found.`);
  }

  if (!(await fs.promises.stat(directory)).isDirectory()) {
    throw new errors.DirectoryNotFound(`Path '${directory}' is not a directory.`);
  }

  api.use(compression());
  api.use('/', express.static(directory));

  return { api };
};

export { getApi };

import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHealthApi } from '../../../../apis/getHealth/http';
import express, { Application } from 'express';

const getApi = async function ({
  configuration
}: {
  configuration: Configuration;
}): Promise<{ api: Application }> {
  const { api: healthApi } = await getHealthApi({
    corsOrigin: getCorsOrigin(configuration.healthCorsOrigin)
  });

  const api = express();

  api.use('/health', healthApi);

  return { api };
};

export { getApi };

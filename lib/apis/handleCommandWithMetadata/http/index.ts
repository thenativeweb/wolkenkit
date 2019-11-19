import { Application } from 'express';
import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CorsOrigin } from '../../base/CorsOrigin';
import { getApiBase } from '../../base/getApiBase';
import { OnReceiveCommand } from '../OnReceiveCommand';
import * as v2 from './v2';

const getApi = async function ({
  corsOrigin,
  onReceiveCommand,
  applicationDefinition
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  applicationDefinition: ApplicationDefinition;
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.post('/v2/', v2.postCommand({
    onReceiveCommand,
    applicationDefinition
  }));

  return { api };
};

export { getApi };

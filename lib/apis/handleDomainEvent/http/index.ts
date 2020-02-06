import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { OnReceiveDomainEvent } from '../OnReceiveDomainEvent';
import express, { Application } from 'express';

const getApi = async function ({
  corsOrigin,
  onReceiveDomainEvent,
  applicationDefinition
}: {
  corsOrigin: CorsOrigin;
  onReceiveDomainEvent: OnReceiveDomainEvent;
  applicationDefinition: ApplicationDefinition;
}): Promise<{ api: Application }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    onReceiveDomainEvent,
    applicationDefinition
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };

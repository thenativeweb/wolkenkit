import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { OnReceiveDomainEvent } from '../OnReceiveDomainEvent';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  corsOrigin,
  onReceiveDomainEvent,
  application
}: {
  corsOrigin: CorsOrigin;
  onReceiveDomainEvent: OnReceiveDomainEvent;
  application: Application;
}): Promise<{ api: ExpressApplication }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    onReceiveDomainEvent,
    application
  });

  api.use('/v2', v2.api);

  return { api };
};

export { getApi };

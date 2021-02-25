import { Application } from '../../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { getMiddleware as getLoggingMiddleware } from 'flaschenpost';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import { postDomainEvent } from './postDomainEvent';

const getV2 = async function ({
  corsOrigin,
  onReceiveDomainEvent,
  application
}: {
  corsOrigin: CorsOrigin;
  onReceiveDomainEvent: OnReceiveDomainEvent;
  application: Application;
}): Promise<{ api: ExpressApplication }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }},
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.use(getLoggingMiddleware());

  api.post(`/${postDomainEvent.path}`, postDomainEvent.getHandler({
    onReceiveDomainEvent,
    application
  }));

  return { api };
};

export { getV2 };

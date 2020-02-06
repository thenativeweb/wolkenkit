import { Application } from 'express';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { getApiBase } from '../../../base/getApiBase';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import { postDomainEvent } from './postDomainEvent';

const getV2 = async function ({
  corsOrigin,
  onReceiveDomainEvent,
  applicationDefinition
}: {
  corsOrigin: CorsOrigin;
  onReceiveDomainEvent: OnReceiveDomainEvent;
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

  api.post('/', postDomainEvent({
    onReceiveDomainEvent,
    applicationDefinition
  }));

  return { api };
};

export { getV2 };

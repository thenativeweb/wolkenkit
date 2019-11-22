import { Application } from 'express';
import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { getApiBase } from '../../base/getApiBase';
import { OnReceiveDomainEvent } from '../OnReceiveDomainEvent';
import * as v2 from './v2';

const getApi = async function ({
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

  api.post('/v2/', v2.postDomainEvent({
    onReceiveDomainEvent,
    applicationDefinition
  }));

  return { api };
};

export { getApi };

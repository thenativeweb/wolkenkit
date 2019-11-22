import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHandleDomainEventsApi } from '../../../../apis/handleDomainEvent/http';
import { getApi as getHealthApi } from '../../../../apis/getHealth/http';
import { OnReceiveDomainEvent } from '../../../../apis/handleDomainEvent/OnReceiveDomainEvent';
import express, { Application } from 'express';

const getPrivateApi = async function ({
  environmentVariables,
  applicationDefinition,
  onReceiveDomainEvent
}: {
  environmentVariables: Record<string, any>;
  applicationDefinition: ApplicationDefinition;
  onReceiveDomainEvent: OnReceiveDomainEvent;
}): Promise<{ api: Application }> {
  const { api: healthApi } = await getHealthApi({
    corsOrigin: getCorsOrigin(environmentVariables.HEALTH_CORS_ORIGIN)
  });

  const { api: handleDomainEventsApi } = await getHandleDomainEventsApi({
    corsOrigin: getCorsOrigin(environmentVariables.DOMAINEVENT_CORS_ORIGIN),
    applicationDefinition,
    onReceiveDomainEvent
  });

  const api = express();

  api.use('/health', healthApi);
  api.use('/domain-event', handleDomainEventsApi);

  return { api };
};

export { getPrivateApi };

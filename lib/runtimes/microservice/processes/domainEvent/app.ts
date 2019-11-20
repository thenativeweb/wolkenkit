#!/usr/bin/env node

import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import express from 'express';
import { flaschenpost } from 'flaschenpost';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getCorsOrigin } from 'get-cors-origin';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getApi as getHandleDomainEventsApi } from '../../../../apis/handleDomainEvent/http';
import { getHandleReceivedDomainEvent } from './getHandleReceivedDomainEvent';
import { getApi as getHealthApi } from '../../../../apis/getHealth/http';
import { getApi as getObserveDomainEventsApi } from '../../../../apis/observeDomainEvents/http';
import http from 'http';
import { IdentityProvider } from 'limes';
import path from 'path';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  registerExceptionHandler();

  const logger = flaschenpost.getLogger();

  const environmentVariables = getEnvironmentVariables({
    APPLICATION_DIRECTORY: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    DOMAINEVENT_CORS_ORIGIN: '*',
    DOMAINEVENTSTORE_OPTIONS: {},
    DOMAINEVENTSTORE_TYPE: 'InMemory',
    HEALTH_CORS_ORIGIN: '*',
    IDENTITY_PROVIDERS: [{
      issuer: 'https://token.invalid',
      certificate: path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
    }],
    PORT_PUBLISHER: 3000,
    PORT_RECEIVER: 4000
  });

  const identityProviders = environmentVariables.IDENTITY_PROVIDERS.
    map((identityProvider): IdentityProvider => new IdentityProvider({
      issuer: identityProvider.issuer,
      certificate: Buffer.from(path.join(identityProvider.certificate, 'certificate.pem'))
    }));

  const applicationDefinition = await getApplicationDefinition({
    applicationDirectory: environmentVariables.APPLICATION_DIRECTORY
  });

  const domainEventStore = await createDomainEventStore({
    type: environmentVariables.DOMAINEVENTSTORE_TYPE,
    options: environmentVariables.DOMAINEVENTSTORE_OPTIONS
  });

  const repository = new Repository({ applicationDefinition, domainEventStore });

  const domainEventPublisherHttp = await getObserveDomainEventsApi({
    corsOrigin: getCorsOrigin(environmentVariables.DOMAINEVENT_CORS_ORIGIN),
    applicationDefinition,
    identityProviders,
    repository
  });

  const healthHttp = await getHealthApi({
    corsOrigin: getCorsOrigin(environmentVariables.HEALTH_CORS_ORIGIN)
  });

  const handleReceivedDomainEvent = getHandleReceivedDomainEvent({
    publishDomainEvent: domainEventPublisherHttp.publishDomainEvent
  });
  const domainEventReceiverHttp = await getHandleDomainEventsApi({
    onReceiveDomainEvent: handleReceivedDomainEvent,
    corsOrigin: '*',
    applicationDefinition
  });

  const domainEventPublisherApi = express();
  const domainEventReceiverApi = express();

  domainEventPublisherApi.use('/domain-events', domainEventPublisherHttp.api);
  domainEventPublisherApi.use('/health', healthHttp.api);

  domainEventReceiverApi.use('/domain-event', domainEventReceiverHttp.api);
  domainEventReceiverApi.use('/health', healthHttp.api);

  const publishingServer = http.createServer(domainEventPublisherApi);
  const receivingServer = http.createServer(domainEventReceiverApi);

  await new Promise((resolve): void => {
    publishingServer.listen(environmentVariables.PORT_PUBLISHER, resolve);
  });

  logger.info('Domain event publisher server started.', { port: environmentVariables.PORT_PUBLISHER });

  await new Promise((resolve): void => {
    receivingServer.listen(environmentVariables.PORT_RECEIVER, resolve);
  });

  logger.info('Domain event receiver server started.', { port: environmentVariables.PORT_RECEIVER });
})();
/* eslint-enable @typescript-eslint/no-floating-promises */

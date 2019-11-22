#!/usr/bin/env node

import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getOnReceiveDomainEvent } from './getOnReceiveDomainEvent';
import { getPrivateApi } from './getPrivateApi';
import { getPublicApi } from './getPublicApi';
import http from 'http';
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
    PORT_PUBLIC: 3000,
    PORT_PRIVATE: 4000
  });

  const identityProviders = await getIdentityProviders({
    identityProvidersEnvironmentVariable: environmentVariables.IDENTITY_PROVIDERS
  });

  const applicationDefinition = await getApplicationDefinition({
    applicationDirectory: environmentVariables.APPLICATION_DIRECTORY
  });

  const domainEventStore = await createDomainEventStore({
    type: environmentVariables.DOMAINEVENTSTORE_TYPE,
    options: environmentVariables.DOMAINEVENTSTORE_OPTIONS
  });

  const repository = new Repository({
    applicationDefinition,
    domainEventStore
  });

  const { api: publicApi, publishDomainEvent } = await getPublicApi({
    environmentVariables,
    applicationDefinition,
    identityProviders,
    repository
  });

  const onReceiveDomainEvent = getOnReceiveDomainEvent({
    publishDomainEvent
  });

  const { api: privateApi } = await getPrivateApi({
    environmentVariables,
    applicationDefinition,
    onReceiveDomainEvent
  });

  const privateServer = http.createServer(privateApi);
  const publicServer = http.createServer(publicApi);

  privateServer.listen(environmentVariables.PORT_PRIVATE, (): void => {
    logger.info('Private server started.', { port: environmentVariables.PORT_PRIVATE });
  });

  publicServer.listen(environmentVariables.PORT_PUBLIC, (): void => {
    logger.info('Public server started.', { port: environmentVariables.PORT_PUBLIC });
  });
})();
/* eslint-enable @typescript-eslint/no-floating-promises */

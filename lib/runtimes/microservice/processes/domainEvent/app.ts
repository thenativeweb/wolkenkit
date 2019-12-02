#!/usr/bin/env node

import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getConfiguration } from './getConfiguration';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getOnReceiveDomainEvent } from './getOnReceiveDomainEvent';
import { getPrivateApi } from './getPrivateApi';
import { getPublicApi } from './getPublicApi';
import http from 'http';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = getConfiguration();

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: configuration.identityProviders
    });

    const applicationDefinition = await getApplicationDefinition({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await createDomainEventStore({
      type: configuration.domainEventStoreType,
      options: configuration.domainEventStoreOptions
    });

    const repository = new Repository({
      applicationDefinition,
      domainEventStore
    });

    const { api: publicApi, publishDomainEvent } = await getPublicApi({
      configuration,
      applicationDefinition,
      identityProviders,
      repository
    });

    const onReceiveDomainEvent = getOnReceiveDomainEvent({
      publishDomainEvent
    });

    const { api: privateApi } = await getPrivateApi({
      configuration,
      applicationDefinition,
      onReceiveDomainEvent
    });

    const privateServer = http.createServer(privateApi);
    const publicServer = http.createServer(publicApi);

    privateServer.listen(configuration.portPrivate, (): void => {
      logger.info('Private server started.', { port: configuration.portPrivate });
    });

    publicServer.listen(configuration.portPublic, (): void => {
      logger.info('Public server started.', { port: configuration.portPublic });
    });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */

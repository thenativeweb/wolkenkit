#!/usr/bin/env node

import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getConfiguration } from './getConfiguration';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import http from 'http';
import { loadApplication } from '../../../../common/application/loadApplication';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../shared/runHealthServer';
import { State } from '../../../../common/elements/State';
import { Client as SubscribeMessagesClient } from '../../../../apis/subscribeMessages/http/v2/Client';
import { validateDomainEvent } from '../../../../common/validators/validateDomainEvent';
import { Value } from 'validate-value';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = getConfiguration();

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: configuration.identityProviders
    });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await createDomainEventStore({
      type: configuration.domainEventStoreType,
      options: configuration.domainEventStoreOptions
    });

    const repository = new Repository({
      application,
      lockStore: await createLockStore({ type: 'InMemory', options: {}}),
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy)
    });

    const { api, publishDomainEvent } = await getApi({
      configuration,
      application,
      identityProviders,
      repository
    });

    const server = http.createServer(api);

    await runHealthServer({ corsOrigin: configuration.healthCorsOrigin, port: configuration.healthPort });

    await new Promise((resolve): void => {
      server.listen(configuration.port, (): void => {
        resolve();
      });
    });

    logger.info(
      'Domain event server started.',
      { port: configuration.port, healthPort: configuration.healthPort }
    );

    const subscribeMessagesClient = new SubscribeMessagesClient({
      protocol: configuration.subscribeMessagesProtocol,
      hostName: configuration.subscribeMessagesHostName,
      port: configuration.subscribeMessagesPort,
      path: '/subscribe/v2'
    });

    const messageStream = await subscribeMessagesClient.getMessages({
      channel: configuration.subscribeMessagesChannel
    });

    for await (const message of messageStream) {
      const domainEvent = new DomainEventWithState<DomainEventData, State>(message);

      try {
        new Value(getDomainEventSchema()).validate(domainEvent);
        validateDomainEvent({ domainEvent, application });
      } catch (ex) {
        logger.error('Received a message via the publisher server with an unexpected format.', { domainEvent, ex });

        return;
      }

      publishDomainEvent({ domainEvent });
    }
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */

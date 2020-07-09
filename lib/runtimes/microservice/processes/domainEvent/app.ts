#!/usr/bin/env node

import { configurationDefinition } from './configurationDefinition';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { flaschenpost } from 'flaschenpost';
import { fromEnvironmentVariables } from '../../../shared/fromEnvironmentVariables';
import { getApi } from './getApi';
import { getDomainEventWithStateSchema } from '../../../../common/schemas/getDomainEventWithStateSchema';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { getSnapshotStrategy } from '../../../../common/domain/getSnapshotStrategy';
import http from 'http';
import { loadApplication } from '../../../../common/application/loadApplication';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../shared/runHealthServer';
import { State } from '../../../../common/elements/State';
import { Client as SubscribeMessagesClient } from '../../../../apis/subscribeMessages/http/v2/Client';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';
import { Value } from 'validate-value';
import {AeonstoreDomainEventStore} from "../../../../stores/domainEventStore/Aeonstore";

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = fromEnvironmentVariables({ configurationDefinition });

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: configuration.identityProviders
    });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await AeonstoreDomainEventStore.create({
      protocol: configuration.aeonstoreProtocol,
      hostName: configuration.aeonstoreHostName,
      port: configuration.aeonstorePort
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
        new Value(getDomainEventWithStateSchema()).validate(domainEvent);
        validateDomainEventWithState({ domainEvent, application });
      } catch (ex) {
        logger.error('Received a message with an unexpected format from the publisher.', { domainEvent, ex });

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

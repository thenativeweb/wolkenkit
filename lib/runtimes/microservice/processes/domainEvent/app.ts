#!/usr/bin/env node

import { AeonstoreDomainEventStore } from '../../../../stores/domainEventStore/Aeonstore';
import { configurationDefinition } from './configurationDefinition';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../messaging/pubSub/createSubscriber';
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
import { Notification } from '../../../../common/elements/Notification';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { runHealthServer } from '../../../shared/runHealthServer';
import { State } from '../../../../common/elements/State';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';
import { Value } from 'validate-value';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = await fromEnvironmentVariables({ configurationDefinition });

    const identityProviders = await getIdentityProviders({
      identityProvidersEnvironmentVariable: configuration.identityProviders
    });

    const application = await loadApplication({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await AeonstoreDomainEventStore.create({
      protocol: configuration.aeonstoreProtocol,
      hostName: configuration.aeonstoreHostName,
      portOrSocket: configuration.aeonstorePortOrSocket
    });

    const publisher = await createPublisher<Notification>(configuration.pubSubOptions.publisher);
    const subscriber = await createSubscriber<DomainEventWithState<DomainEventData, State>>(
      configuration.pubSubOptions.subscriber
    );

    const repository = new Repository({
      application,
      lockStore: await createLockStore({ type: 'InMemory' }),
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy(configuration.snapshotStrategy),
      publisher,
      pubSubChannelForNotifications: configuration.pubSubOptions.channelForNotifications
    });

    const { api, publishDomainEvent } = await getApi({
      configuration,
      application,
      identityProviders,
      repository
    });

    const server = http.createServer(api);

    await runHealthServer({
      corsOrigin: configuration.healthCorsOrigin,
      portOrSocket: configuration.healthPortOrSocket
    });

    await new Promise<void>((resolve): void => {
      server.listen(configuration.portOrSocket, (): void => {
        resolve();
      });
    });

    logger.info('Domain event server started.', {
      portOrSocket: configuration.portOrSocket,
      healthPortOrSocket: configuration.healthPortOrSocket
    });

    await subscriber.subscribe({
      channel: configuration.pubSubOptions.channelForNewDomainEvents,
      callback (rawDomainEvent: DomainEventWithState<DomainEventData, State>): void {
        const domainEvent = new DomainEventWithState<DomainEventData, State>(rawDomainEvent);

        try {
          new Value(getDomainEventWithStateSchema()).validate(domainEvent, { valueName: 'domainEvent' });
          validateDomainEventWithState({ domainEvent, application });
        } catch (ex: unknown) {
          logger.error('Received a message with an unexpected format from the publisher.', { domainEvent, ex });

          return;
        }

        publishDomainEvent({ domainEvent });
      }
    });
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */

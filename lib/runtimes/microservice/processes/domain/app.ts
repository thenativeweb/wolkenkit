#!/usr/bin/env node

import { AeonstoreDomainEventStore } from '../../../../stores/domainEventStore/Aeonstore';
import { Client as DispatcherClient } from '../../../../apis/awaitCommandWithMetadata/http/v2/Client';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getConfiguration } from './getConfiguration';
import http from 'http';
import pForever from 'p-forever';
import { processCommand } from './processCommand';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { Client as PublisherClient } from '../../../../apis/publishMessage/http/v2/Client';
import { registerExceptionHandler } from '../../../../common/utils/process/registerExceptionHandler';
import { Repository } from '../../../../common/domain/Repository';
import { State } from '../../../../common/elements/State';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  const logger = flaschenpost.getLogger();

  try {
    registerExceptionHandler();

    const configuration = getConfiguration();

    const applicationDefinition = await getApplicationDefinition({
      applicationDirectory: configuration.applicationDirectory
    });

    const domainEventStore = await AeonstoreDomainEventStore.create({
      hostName: configuration.aeonstoreHostName,
      port: configuration.aeonstorePort
    });

    const repository = new Repository({
      applicationDefinition,
      domainEventStore
    });

    const dispatcherClient = new DispatcherClient({
      protocol: configuration.dispatcherProtocol,
      hostName: configuration.dispatcherHostName,
      port: configuration.dispatcherPort,
      path: '/await-command/v2'
    });

    const publisherClient = new PublisherClient({
      protocol: configuration.publisherProtocol,
      hostName: configuration.publisherHostName,
      port: configuration.publisherPort,
      path: '/publish/v2/'
    });

    const publishDomainEvents: PublishDomainEvents = async ({ domainEvents }: {
      domainEvents: DomainEventWithState<DomainEventData, State>[];
    }): Promise<any> => {
      for (const domainEvent of domainEvents) {
        await publisherClient.postMessage({ message: domainEvent });
      }
    };

    const { api } = await getApi({
      configuration
    });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info('Domain server started.', { port: configuration.port });
    });

    for (let i = 0; i < configuration.concurrentCommands; i++) {
      pForever(async (): Promise<void> => {
        await processCommand({
          dispatcher: {
            client: dispatcherClient,
            renewalInterval: configuration.dispatcherRenewInterval,
            acknowledgeRetries: configuration.dispatcherAcknowledgeRetries
          },
          applicationDefinition,
          repository,
          publishDomainEvents
        });
      });
    }
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */

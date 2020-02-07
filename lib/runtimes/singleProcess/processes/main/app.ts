#!/usr/bin/env node

import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getApi } from './getApi';
import { getApplicationDefinition } from '../../../../common/application/getApplicationDefinition';
import { getConfiguration } from './getConfiguration';
import { getIdentityProviders } from '../../../shared/getIdentityProviders';
import { handleCommand } from '../../../../common/domain/handleCommand';
import http from 'http';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
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

    const getOnReceiveCommand = function ({ publishDomainEvent }: { publishDomainEvent: PublishDomainEvent }): OnReceiveCommand {
      const publishDomainEvents: PublishDomainEvents = async function ({ domainEvents }): Promise<void> {
        for (const domainEvent of domainEvents) {
          publishDomainEvent({ domainEvent });
        }
      };

      return async ({ command }): Promise<void> => {
        await handleCommand({
          command,
          applicationDefinition,
          publishDomainEvents,
          repository
        });
      };
    };

    const { api } = await getApi({
      configuration,
      applicationDefinition,
      identityProviders,
      getOnReceiveCommand,
      repository
    });

    const server = http.createServer(api);

    server.listen(configuration.port, (): void => {
      logger.info('Single process runtime server started.', { port: configuration.port });
    });
  } catch (ex) {
    logger.fatal('An unexpected error occured.', { ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */

import { ClientMetadata } from '../../http/ClientMetadata';
import { createPublisher } from '../../../../messaging/pubSub/createPublisher';
import { executeNotificationSubscribers } from '../../../domain/executeNotificationSubscribers';
import { executeStreamQueryHandler } from '../../../domain/executeStreamQueryHandler';
import { getClientService } from '../../../services/getClientService';
import { getLoggerService } from '../../../services/getLoggerService';
import { getNotificationService } from '../../../services/getNotificationService';
import { Notification } from '../../../elements/Notification';
import { QueryOptions } from '../../../elements/QueryOptions';
import { Readable } from 'stream';
import { SandboxConfigurationForView } from './SandboxConfiguration';
import { SandboxForView } from './SandboxForView';

const createSandboxForView = function (sandboxConfiguration: SandboxConfigurationForView): SandboxForView {
  return {
    async query <TQueryOptions extends QueryOptions = QueryOptions>({ queryName, queryOptions, clientMetadata }: {
      queryName: string;
      queryOptions?: TQueryOptions;
      clientMetadata?: ClientMetadata;
    }): Promise<Readable> {
      const clientServiceFactory = sandboxConfiguration.clientServiceFactory ?? getClientService,
            loggerServiceFactory = sandboxConfiguration.loggerServiceFactory ?? getLoggerService;

      return await executeStreamQueryHandler({
        application: sandboxConfiguration.application,
        queryHandlerIdentifier: {
          view: { name: sandboxConfiguration.viewName },
          name: queryName
        },
        services: {
          client: clientServiceFactory({ clientMetadata: clientMetadata ?? {
            ip: '127.0.0.1',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            token: '...'
          }}),
          logger: loggerServiceFactory({
            packageManifest: sandboxConfiguration.application.packageManifest,
            fileName: `<app>/server/views/${sandboxConfiguration.viewName}/queries/${queryName}`
          })
        },
        options: queryOptions ?? {}
      });
    },

    async notify <TNotification extends Notification>({ notification }: { notification: TNotification }): Promise<void> {
      const loggerServiceFactory = sandboxConfiguration.loggerServiceFactory ?? getLoggerService,
            notificationServiceFactory = sandboxConfiguration.notificationServiceFactory ?? getNotificationService,
            publisher = sandboxConfiguration.publisher ?? await createPublisher({ type: 'InMemory' });

      for (const viewName of Object.keys(sandboxConfiguration.application.views)) {
        await executeNotificationSubscribers({
          application: sandboxConfiguration.application,
          viewName,
          notification,
          services: {
            logger: loggerServiceFactory({
              packageManifest: sandboxConfiguration.application.packageManifest,
              fileName: `<app>/server/views/${sandboxConfiguration.viewName}/notificationSubscribers`
            }),
            notification: notificationServiceFactory({
              application: sandboxConfiguration.application,
              publisher,
              channel: 'notifications'
            })
          }
        });
      }
    }
  };
};

export { createSandboxForView };

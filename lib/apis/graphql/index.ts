import { Application } from '../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from './InitializeGraphQlOnServer';
import { Notification } from '../../common/elements/Notification';
import { OnCancelCommand } from './OnCancelCommand';
import { OnReceiveCommand } from './OnReceiveCommand';
import { PublishDomainEvent } from './PublishDomainEvent';
import { Repository } from '../../common/domain/Repository';
import { Subscriber } from '../../messaging/pubSub/Subscriber';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  corsOrigin,
  application,
  identityProviders,
  handleCommand,
  observeDomainEvents,
  observeNotifications,
  queryView,
  enableIntegratedClient,
  webSocketEndpoint
}: {
  corsOrigin: CorsOrigin;
  application: Application;
  identityProviders: IdentityProvider[];
  handleCommand: false | { onReceiveCommand: OnReceiveCommand; onCancelCommand: OnCancelCommand };
  observeDomainEvents: false | { repository: Repository };
  observeNotifications: false | { subscriber: Subscriber<Notification>; channelForNotifications: string };
  queryView: boolean;
  enableIntegratedClient: boolean;
  webSocketEndpoint: string;
}): Promise<{
    api: ExpressApplication;
    publishDomainEvent?: PublishDomainEvent;
    initializeGraphQlOnServer: InitializeGraphQlOnServer;
  }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    application,
    identityProviders,
    handleCommand,
    observeDomainEvents,
    observeNotifications,
    queryView,
    enableIntegratedClient,
    webSocketEndpoint
  });

  api.use('/v2', v2.api);

  return {
    api,
    publishDomainEvent: v2.publishDomainEvent,
    initializeGraphQlOnServer: v2.initializeGraphQlOnServer
  };
};

export { getApi };

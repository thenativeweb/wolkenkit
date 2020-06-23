import { Application } from '../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from './InitializeGraphQlOnServer';
import { OnReceiveCommand } from './OnReceiveCommand';
import { PublishDomainEvent } from './PublishDomainEvent';
import { Repository } from '../../common/domain/Repository';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  corsOrigin,
  application,
  identityProviders,
  handleCommand,
  observeDomainEvents,
  enableIntegratedClient
}: {
  corsOrigin: CorsOrigin;
  application: Application;
  identityProviders: IdentityProvider[];
  handleCommand: false | { onReceiveCommand: OnReceiveCommand };
  observeDomainEvents: false | { repository: Repository; webSocketEndpoint: string };
  enableIntegratedClient: boolean;
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
    enableIntegratedClient
  });

  api.use('/v2', v2.api);

  return {
    api,
    publishDomainEvent: v2.publishDomainEvent,
    initializeGraphQlOnServer: v2.initializeGraphQlOnServer
  };
};

export { getApi };

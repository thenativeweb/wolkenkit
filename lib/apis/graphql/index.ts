import { ApplicationDefinition } from '../../common/application/ApplicationDefinition';
import { CorsOrigin } from 'get-cors-origin';
import { getV2 } from './v2';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from './InitializeGraphQlOnServer';
import { OnReceiveCommand } from './OnReceiveCommand';
import { PublishDomainEvent } from './PublishDomainEvent';
import { Repository } from '../../common/domain/Repository';
import express, { Application } from 'express';

const getApi = async function ({
  corsOrigin,
  applicationDefinition,
  identityProviders,
  handleCommand,
  observeDomainEvents,
  playground
}: {
  corsOrigin: CorsOrigin;
  applicationDefinition: ApplicationDefinition;
  identityProviders: IdentityProvider[];
  handleCommand: false | { onReceiveCommand: OnReceiveCommand };
  observeDomainEvents: false | { repository: Repository; webSocketEndpoint: string };
  playground: boolean;
}): Promise<{
    api: Application;
    publishDomainEvent?: PublishDomainEvent;
    initializeGraphQlOnServer: InitializeGraphQlOnServer;
  }> {
  const api = express();

  const v2 = await getV2({
    corsOrigin,
    applicationDefinition,
    identityProviders,
    handleCommand,
    observeDomainEvents,
    playground
  });

  api.use('/v2', v2.api);

  return {
    api,
    publishDomainEvent: v2.publishDomainEvent,
    initializeGraphQlOnServer: v2.initializeGraphQlOnServer
  };
};

export { getApi };

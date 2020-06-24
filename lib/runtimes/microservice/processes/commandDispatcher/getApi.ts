import { Application } from '../../../../common/application/Application';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Configuration } from './Configuration';
import { getApi as getAwaitCommandWithMetadataApi } from '../../../../apis/awaitCommandWithMetadata/http';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHandleCommandWithMetadataApi } from '../../../../apis/handleCommandWithMetadata/http';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../../../apis/handleCommandWithMetadata/OnCancelCommand';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import express, { Application as ExpressApplication } from 'express';

const getApi = async function ({
  configuration,
  application,
  priorityQueueStore,
  newCommandSubscriber,
  newCommandPubSubChannel,
  onReceiveCommand,
  onCancelCommand
}: {
  configuration: Configuration;
  application: Application;
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;
  newCommandSubscriber: Subscriber<object>;
  newCommandPubSubChannel: string;
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
}): Promise<{ api: ExpressApplication }> {
  const { api: handleCommandApi } = await getHandleCommandWithMetadataApi({
    corsOrigin: getCorsOrigin(configuration.handleCommandCorsOrigin),
    onReceiveCommand,
    onCancelCommand,
    application
  });

  const { api: awaitCommandWithMetadataApi } = await getAwaitCommandWithMetadataApi({
    application,
    corsOrigin: getCorsOrigin(configuration.awaitCommandCorsOrigin),
    priorityQueueStore,
    newCommandSubscriber,
    newCommandSubscriberChannel: newCommandPubSubChannel
  });

  const api = express();

  api.use('/handle-command', handleCommandApi);
  api.use('/await-command', awaitCommandWithMetadataApi);

  return { api };
};

export { getApi };

import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Configuration } from './Configuration';
import { getApi as getAwaitCommandWithMetadataApi } from '../../../../apis/awaitCommandWithMetadata/http';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getHandleCommandWithMetadataApi } from '../../../../apis/handleCommandWithMetadata/http';
import { getApi as getHealthApi } from '../../../../apis/getHealth/http';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import express, { Application } from 'express';

const getApi = async function ({
  configuration,
  applicationDefinition,
  priorityQueueStore,
  onReceiveCommand,
  queuePollInterval
}: {
  configuration: Configuration;
  applicationDefinition: ApplicationDefinition;
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;
  onReceiveCommand: OnReceiveCommand;
  queuePollInterval: number;
}): Promise<{ api: Application }> {
  const { api: healthApi } = await getHealthApi({
    corsOrigin: getCorsOrigin(configuration.healthCorsOrigin)
  });

  const { api: handleCommandApi } = await getHandleCommandWithMetadataApi({
    corsOrigin: getCorsOrigin(configuration.handleCommandCorsOrigin),
    onReceiveCommand,
    applicationDefinition
  });

  const { api: awaitCommandWithMetadataApi } = await getAwaitCommandWithMetadataApi({
    applicationDefinition,
    corsOrigin: getCorsOrigin(configuration.awaitCommandCorsOrigin),
    priorityQueueStore,
    pollInterval: queuePollInterval
  });

  const api = express();

  api.use('/health', healthApi);
  api.use('/handle-command', handleCommandApi);
  api.use('/await-command', awaitCommandWithMetadataApi);

  return { api };
};

export { getApi };

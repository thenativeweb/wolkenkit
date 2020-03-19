import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { cloneDeep } from 'lodash';
import { Command } from '../../../../common/elements/Command';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { ContextIdentifier } from '../../../../common/elements/ContextIdentifier';
import { flaschenpost } from 'flaschenpost';
import { IFieldResolver } from 'graphql-tools';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { uuid } from 'uuidv4';
import { validateCommand } from '../../../../common/validators/validateCommand';

const logger = flaschenpost.getLogger();

const getCommandResolver = function ({
  contextIdentifier,
  aggregateIdentifier,
  commandName,
  applicationDefinition,
  onReceiveCommand
}: {
  contextIdentifier: ContextIdentifier;
  aggregateIdentifier: AggregateIdentifier;
  commandName: string;
  applicationDefinition: ApplicationDefinition;
  onReceiveCommand: OnReceiveCommand;
}): IFieldResolver<any, { clientMetadata: ClientMetadata }> {
  return async ({ data }, { clientMetadata }): Promise<{ id: string }> => {
    const command = new Command({
      contextIdentifier,
      aggregateIdentifier,
      name: commandName,
      data: data === undefined ? {} : cloneDeep(data)
    });

    validateCommand({ command, applicationDefinition });

    const commandId = uuid();
    const commandWithMetadata = new CommandWithMetadata({
      ...command,
      id: commandId,
      metadata: {
        causationId: commandId,
        correlationId: commandId,
        timestamp: Date.now(),
        client: clientMetadata,
        initiator: { user: clientMetadata.user }
      }
    });

    logger.info('Command received.', { command: commandWithMetadata });

    await onReceiveCommand({ command: commandWithMetadata });

    return { id: commandId };
  };
};

export { getCommandResolver };

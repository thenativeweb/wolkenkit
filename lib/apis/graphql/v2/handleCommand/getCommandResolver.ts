import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { cloneDeep } from 'lodash';
import { Command } from '../../../../common/elements/Command';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { ContextIdentifier } from '../../../../common/elements/ContextIdentifier';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getCommandSchema } from '../../../../common/schemas/getCommandSchema';
import { IFieldResolver } from 'graphql-tools';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { uuid } from 'uuidv4';
import { validateCommand } from '../../../../common/validators/validateCommand';
import { Value } from 'validate-value';

const logger = flaschenpost.getLogger();

const commandSchema = new Value(getCommandSchema());

const getCommandResolver = function ({
  contextIdentifier,
  aggregateIdentifier,
  commandName,
  application,
  onReceiveCommand
}: {
  contextIdentifier: ContextIdentifier;
  aggregateIdentifier: AggregateIdentifier;
  commandName: string;
  application: Application;
  onReceiveCommand: OnReceiveCommand;
}): IFieldResolver<any, { clientMetadata: ClientMetadata }> {
  return async ({ data }, { clientMetadata }): Promise<{ id: string }> => {
    const command = new Command({
      contextIdentifier,
      aggregateIdentifier,
      name: commandName,
      data: data === undefined ? {} : cloneDeep(data)
    });

    try {
      commandSchema.validate(command, { valueName: 'command' });
    } catch (ex) {
      throw new errors.CommandMalformed(ex.message);
    }
    validateCommand({ command, application });

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

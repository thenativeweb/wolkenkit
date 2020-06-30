import { Command } from '../elements/Command';
import { CommandData } from '../elements/CommandData';
import { CommandService } from './CommandService';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { Initiator } from '../elements/Initiator';
import { Limes } from 'limes';
import { uuid } from 'uuidv4';

const getCommandService = function ({
  domainEvent, onIssueCommand
}: {
  domainEvent: DomainEvent<DomainEventData>;
  onIssueCommand: (parameters: { command: CommandWithMetadata<CommandData> }) => void | Promise<void>;
}): CommandService {
  return {
    async issueCommand<TCommandData extends CommandData>(command: Command<TCommandData>, initiator?: Initiator): Promise<string> {
      const commandWithMetadata = new CommandWithMetadata<TCommandData>({
        ...command,
        id: uuid(),
        metadata: {
          causationId: domainEvent.id,
          correlationId: domainEvent.metadata.correlationId,
          timestamp: Date.now(),
          initiator: initiator ?? domainEvent.metadata.initiator,
          client: {
            ip: '127.0.0.1',
            token: Limes.issueUntrustedToken({ issuer: 'https://token.invalid', subject: 'flow' }).token,
            user: { id: 'flow', claims: { sub: 'flow' }}
          }
        }
      });

      await onIssueCommand({ command: commandWithMetadata });

      return commandWithMetadata.id;
    }
  };
};

export { getCommandService };

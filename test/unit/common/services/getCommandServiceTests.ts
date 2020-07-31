import { assert } from 'assertthat';
import { buildCommand } from '../../../../lib/common/utils/test/buildCommand';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { getCommandService } from '../../../../lib/common/services/getCommandService';
import { regex } from '../../../../lib/common/utils/uuid';
import { v4 } from 'uuid';

suite('getCommandService', (): void => {
  test('calls onIssueCommand with the created command with metadata.', async (): Promise<void> => {
    const issuedCommands: CommandWithMetadata<CommandData>[] = [];
    const onIssueCommand = ({ command }: { command: CommandWithMetadata<CommandData>}): void => {
      issuedCommands.push(command);
    };

    const domainEvent = buildDomainEvent({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
      name: 'executed',
      data: { strategy: 'succeed' },
      metadata: {
        initiator: {
          user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
        },
        revision: 1
      }
    });

    const commandService = getCommandService({ domainEvent, issueCommand: onIssueCommand });

    const command = buildCommand({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
      name: 'execute',
      data: { strategy: 'succeed' }
    });
    const initiator = {
      user: { id: 'john.doe', claims: { sub: 'john.doe' }}
    };

    const commandId = await commandService.issueCommand(
      command,
      initiator
    );

    assert.that(commandId).is.matching(regex);
    assert.that(issuedCommands.length).is.equalTo(1);
    assert.that(issuedCommands[0]).is.atLeast({
      ...command,
      metadata: {
        causationId: domainEvent.id,
        correlationId: domainEvent.metadata.correlationId,
        client: {
          ip: '127.0.0.1',
          user: { id: 'flow', claims: { sub: 'flow' }}
        },
        initiator
      }
    });
  });

  test(`uses the domain event's initiator if none is given.`, async (): Promise<void> => {
    const issuedCommands: CommandWithMetadata<CommandData>[] = [];
    const onIssueCommand = ({ command }: { command: CommandWithMetadata<CommandData>}): void => {
      issuedCommands.push(command);
    };

    const domainEvent = buildDomainEvent({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
      name: 'executed',
      data: { strategy: 'succeed' },
      metadata: {
        initiator: {
          user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
        },
        revision: 1
      }
    });

    const commandService = getCommandService({ domainEvent, issueCommand: onIssueCommand });

    const command = buildCommand({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
      name: 'execute',
      data: { strategy: 'succeed' }
    });

    await commandService.issueCommand(
      command
    );

    assert.that(issuedCommands.length).is.equalTo(1);
    assert.that(issuedCommands[0].metadata.initiator).is.equalTo(domainEvent.metadata.initiator);
  });
});

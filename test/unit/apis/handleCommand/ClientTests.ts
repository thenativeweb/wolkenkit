import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/handleCommand/http/v2/Client';
import { Command } from '../../../../lib/common/elements/Command';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { getApi } from '../../../../lib/apis/handleCommand/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { runAsServer } from '../../../shared/http/runAsServer';
import { uuid } from 'uuidv4';

suite('handleCommand/http/Client', (): void => {
  const identityProviders = [ identityProvider ];

  let applicationDefinition: ApplicationDefinition;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      applicationDefinition = await getApplicationDefinition({ applicationDirectory });
    });

    suite('getDescription', (): void => {
      let api: Application;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveCommand (): Promise<void> {
          // Intentionally left blank.
          },
          applicationDefinition,
          identityProviders
        }));
      });

      test('returns the commands description.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const description = await client.getDescription();

        const { commands: commandsDescription } = getApplicationDescription({
          applicationDefinition
        });

        // Convert and parse as JSON, to get rid of any values that are undefined.
        // This is what the HTTP API does internally, and here we need to simulate
        // this to make things work.
        const expectedCommandsDescription =
          JSON.parse(JSON.stringify(commandsDescription));

        assert.that(description).is.equalTo(expectedCommandsDescription);
      });
    });

    suite('postCommand', (): void => {
      let api: Application,
          receivedCommands: CommandWithMetadata<CommandData>[];

      setup(async (): Promise<void> => {
        receivedCommands = [];

        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveCommand ({ command }: {
            command: CommandWithMetadata<CommandData>;
          }): Promise<void> {
            receivedCommands.push(command);
          },
          applicationDefinition,
          identityProviders
        }));
      });

      test('throws an exception if a command is sent with a non-existent context name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === 'ECONTEXTNOTFOUND' &&
          (ex as CustomError).message === `Context 'nonExistent' not found.`);
      });

      test('throws an exception if a command is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === 'EAGGREGATENOTFOUND' &&
          (ex as CustomError).message === `Aggregate 'sampleContext.nonExistent' not found.`);
      });

      test('throws an exception if a command is sent with a non-existent command name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' }
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === 'ECOMMANDNOTFOUND' &&
          (ex as CustomError).message === `Command 'sampleContext.sampleAggregate.nonExistent' not found.`);
      });

      test('throws an exception if a command is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'invalid-value' }
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === 'ECOMMANDMALFORMED' &&
          (ex as CustomError).message === 'No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).');
      });

      test('sends commands.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.postCommand({ command });

        assert.that(receivedCommands.length).is.equalTo(1);
        assert.that(receivedCommands[0]).is.atLeast({
          contextIdentifier: command.contextIdentifier,
          aggregateIdentifier: command.aggregateIdentifier,
          name: command.name,
          data: command.data,
          metadata: {
            client: {
              user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' }}
            },
            initiator: {
              user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' }}
            }
          }
        });

        assert.that(receivedCommands[0].id).is.ofType('string');
        assert.that(receivedCommands[0].metadata.causationId).is.equalTo(receivedCommands[0].id);
        assert.that(receivedCommands[0].metadata.correlationId).is.equalTo(receivedCommands[0].id);
        assert.that(receivedCommands[0].metadata.timestamp).is.ofType('number');
        assert.that(receivedCommands[0].metadata.client.token).is.ofType('string');
        assert.that(receivedCommands[0].metadata.client.ip).is.ofType('string');
      });

      test('returns the ID of the sent command.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        const { id } = await client.postCommand({ command });

        assert.that(id).is.equalTo(receivedCommands[0].id);
      });

      test('throws an error if on received command throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveCommand (): Promise<void> {
            throw new Error('Failed to handle received command.');
          },
          applicationDefinition,
          identityProviders
        }));

        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === 'EUNKNOWNERROR' &&
          (ex as CustomError).message === 'Unknown error.');
      });
    });
  });
});

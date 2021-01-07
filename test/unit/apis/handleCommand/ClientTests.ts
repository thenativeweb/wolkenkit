import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/handleCommand/http/v2/Client';
import { Command } from '../../../../lib/common/elements/Command';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/handleCommand/http';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { ItemIdentifier } from '../../../../lib/common/elements/ItemIdentifier';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';

suite('handleCommand/http/Client', (): void => {
  const identityProviders = [ identityProvider ];

  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      application = await loadApplication({ applicationDirectory });
    });

    suite('getDescription', (): void => {
      let api: ExpressApplication;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveCommand (): Promise<void> {
            // Intentionally left blank.
          },
          async onCancelCommand (): Promise<void> {
            // Intentionally left blank.
          },
          application,
          identityProviders
        }));
      });

      test('returns the commands description.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const description = await client.getDescription();

        const { commands: commandsDescription } = getApplicationDescription({
          application
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
      let api: ExpressApplication,
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
          async onCancelCommand (): Promise<void> {
            // Intentionally left blank.
          },
          application,
          identityProviders
        }));
      });

      test('throws an exception if a command is sent with a non-existent context name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.ContextNotFound.code &&
          (ex as CustomError).message === `Context 'nonExistent' not found.`);
      });

      test('throws an exception if a command is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.AggregateNotFound.code &&
          (ex as CustomError).message === `Aggregate 'sampleContext.nonExistent' not found.`);
      });

      test('throws an exception if a command is sent with a non-existent command name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'nonExistent',
          data: { strategy: 'succeed' }
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.CommandNotFound.code &&
          (ex as CustomError).message === `Command 'sampleContext.sampleAggregate.nonExistent' not found.`);
      });

      test('throws an exception if a command is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'invalid-value' }
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.CommandMalformed.code &&
          (ex as CustomError).message === 'No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).');
      });

      test('sends commands.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
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

      test('sends commands without aggregate id.', async (): Promise<void> => {
        const command = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate' },
          name: 'execute',
          data: { strategy: 'succeed' }
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await client.postCommand({ command });

        assert.that(receivedCommands.length).is.equalTo(1);
        assert.that(receivedCommands[0]).is.atLeast({
          contextIdentifier: command.contextIdentifier,
          aggregateIdentifier: {
            name: command.aggregateIdentifier.name
          },
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

        assert.that(receivedCommands[0].aggregateIdentifier.id).is.ofType('string');
        assert.that(receivedCommands[0].id).is.ofType('string');
        assert.that(receivedCommands[0].metadata.causationId).is.equalTo(receivedCommands[0].id);
        assert.that(receivedCommands[0].metadata.correlationId).is.equalTo(receivedCommands[0].id);
        assert.that(receivedCommands[0].metadata.timestamp).is.ofType('number');
        assert.that(receivedCommands[0].metadata.client.token).is.ofType('string');
        assert.that(receivedCommands[0].metadata.client.ip).is.ofType('string');
      });

      test('returns the ID and the aggregate ID of the sent command.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const { id, aggregateIdentifier } = await client.postCommand({ command });

        assert.that(id).is.equalTo(receivedCommands[0].id);
        assert.that(aggregateIdentifier).is.equalTo({ id: command.aggregateIdentifier.id });
      });

      test('throws an error if on received command throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveCommand (): Promise<void> {
            throw new Error('Failed to handle received command.');
          },
          async onCancelCommand (): Promise<void> {
            // Intentionally left blank.
          },
          application,
          identityProviders
        }));

        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postCommand({ command });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.UnknownError.code &&
          (ex as CustomError).message === 'Unknown error.');
      });
    });

    suite('cancelCommand', (): void => {
      let api: ExpressApplication,
          cancelledCommands: ItemIdentifierWithClient[];

      setup(async (): Promise<void> => {
        cancelledCommands = [];

        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveCommand (): Promise<void> {
            // Intentionally left blank.
          },
          async onCancelCommand ({ commandIdentifierWithClient }: {
            commandIdentifierWithClient: ItemIdentifierWithClient;
          }): Promise<void> {
            cancelledCommands.push(commandIdentifierWithClient);
          },
          application,
          identityProviders
        }));
      });

      test('throws an exception if a non-existent context name is given.', async (): Promise<void> => {
        const commandIdentifier: ItemIdentifier = {
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          id: v4()
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.cancelCommand({ commandIdentifier });
        }).is.throwingAsync((ex): boolean => (ex as CustomError).code === errors.ContextNotFound.code);
      });

      test('throws an exception if a non-existent aggregate name is given.', async (): Promise<void> => {
        const commandIdentifier: ItemIdentifier = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: v4() },
          name: 'execute',
          id: v4()
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.cancelCommand({ commandIdentifier });
        }).is.throwingAsync((ex): boolean => (ex as CustomError).code === errors.AggregateNotFound.code);
      });

      test('throws an exception if a non-existent command name is given.', async (): Promise<void> => {
        const commandIdentifier: ItemIdentifier = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'nonExistent',
          id: v4()
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.cancelCommand({ commandIdentifier });
        }).is.throwingAsync((ex): boolean => (ex as CustomError).code === errors.CommandNotFound.code);
      });

      test('cancels commands.', async (): Promise<void> => {
        const commandIdentifier: ItemIdentifier = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          id: v4()
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await client.cancelCommand({ commandIdentifier });

        assert.that(cancelledCommands.length).is.equalTo(1);
        assert.that(cancelledCommands[0]).is.atLeast({
          contextIdentifier: commandIdentifier.contextIdentifier,
          aggregateIdentifier: commandIdentifier.aggregateIdentifier,
          name: commandIdentifier.name,
          id: commandIdentifier.id,
          client: {
            user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' }}
          }
        });
      });

      test('throws an error if on received command throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveCommand (): Promise<void> {
            // Intentionally left blank.
          },
          async onCancelCommand (): Promise<void> {
            throw new Error('Failed to cancel command.');
          },
          application,
          identityProviders
        }));

        const commandIdentifier: ItemIdentifier = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          id: v4()
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.cancelCommand({ commandIdentifier });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.UnknownError.code &&
            (ex as CustomError).message === 'Unknown error.');
      });
    });
  });
});

import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/handleCommandWithMetadata/http/v2/Client';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/handleCommandWithMetadata/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';

suite('handleCommandWithMetadata/http/Client', (): void => {
  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      application = await loadApplication({ applicationDirectory });
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
          application
        }));
      });

      test('throws an exception if a command is sent with a non-existent context name.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
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
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
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
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'nonExistent',
          data: { strategy: 'succeed' },
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
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
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'invalid-value' },
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
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
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
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
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        assert.that(receivedCommands[0].id).is.ofType('string');
        assert.that(receivedCommands[0].metadata.causationId).is.ofType('string');
        assert.that(receivedCommands[0].metadata.correlationId).is.ofType('string');
        assert.that(receivedCommands[0].metadata.timestamp).is.ofType('number');
      });

      test('returns the ID of the sent command.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
        });

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
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
          async onCancelCommand (): Promise<void> {
            // Intentionally left blank.
          },
          application
        }));

        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: v4(),
          metadata: {
            causationId: v4(),
            correlationId: v4(),
            timestamp: Date.now(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            },
            initiator: {
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
            }
          }
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
          application
        }));
      });

      test('throws an exception if a non-existent context name is given.', async (): Promise<void> => {
        const commandIdentifierWithClient: ItemIdentifierWithClient = {
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          id: v4(),
          client: {
            ip: '127.0.0.1',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            token: '...'
          }
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.cancelCommand({ commandIdentifierWithClient });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.ContextNotFound.code &&
          (ex as CustomError).message === `Context 'nonExistent' not found.`);
      });

      test('throws an exception if a non-existent aggregate name is given.', async (): Promise<void> => {
        const commandIdentifierWithClient: ItemIdentifierWithClient = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: v4() },
          name: 'execute',
          id: v4(),
          client: {
            ip: '127.0.0.1',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            token: '...'
          }
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.cancelCommand({ commandIdentifierWithClient });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.AggregateNotFound.code &&
          (ex as CustomError).message === `Aggregate 'sampleContext.nonExistent' not found.`);
      });

      test('throws an exception if a non-existent command name is given.', async (): Promise<void> => {
        const commandIdentifierWithClient: ItemIdentifierWithClient = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'nonExistent',
          id: v4(),
          client: {
            ip: '127.0.0.1',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            token: '...'
          }
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.cancelCommand({ commandIdentifierWithClient });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.CommandNotFound.code &&
          (ex as CustomError).message === `Command 'sampleContext.sampleAggregate.nonExistent' not found.`);
      });

      test('cancels commands.', async (): Promise<void> => {
        const commandIdentifierWithClient: ItemIdentifierWithClient = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          id: v4(),
          client: {
            ip: '127.0.0.1',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            token: '...'
          }
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await client.cancelCommand({ commandIdentifierWithClient });

        assert.that(cancelledCommands.length).is.equalTo(1);
        assert.that(cancelledCommands[0]).is.equalTo(commandIdentifierWithClient);
      });

      test('throws an error if on cancel command throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveCommand (): Promise<void> {
            // Intentionally left blank.
          },
          async onCancelCommand (): Promise<void> {
            throw new Error('Failed to cancel command.');
          },
          application
        }));

        const commandIdentifierWithClient: ItemIdentifierWithClient = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
          name: 'execute',
          id: v4(),
          client: {
            ip: '127.0.0.1',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            token: '...'
          }
        };

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.cancelCommand({ commandIdentifierWithClient });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.UnknownError.code &&
          (ex as CustomError).message === 'Unknown error.');
      });
    });
  });
});

import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/handleCommandWithMetadata/http/v2/Client';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { getApi } from '../../../../lib/apis/handleCommandWithMetadata/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { runAsServer } from '../../../shared/http/runAsServer';
import { uuid } from 'uuidv4';

suite('handleCommandWithMetadata/http/Client', (): void => {
  let applicationDefinition: ApplicationDefinition;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      applicationDefinition = await getApplicationDefinition({ applicationDirectory });
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
          applicationDefinition
        }));
      });

      test('throws an exception if a command is sent with a non-existent context name.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: uuid(),
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
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
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: uuid(),
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
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
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' },
          id: uuid(),
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
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
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'invalid-value' },
          id: uuid(),
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
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
        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: uuid(),
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
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
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: uuid(),
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
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
          applicationDefinition
        }));

        const command = new CommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          id: uuid(),
          metadata: {
            causationId: uuid(),
            correlationId: uuid(),
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

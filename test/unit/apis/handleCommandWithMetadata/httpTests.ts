import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/handleCommandWithMetadata/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';

suite('handleCommandWithMetadata/http', (): void => {
  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      application = await loadApplication({ applicationDirectory });
    });

    suite('POST /', (): void => {
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

      test('returns 415 if the content-type header is missing.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          headers: {
            'content-type': ''
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: errors.ContentTypeMismatch.code,
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          headers: {
            'content-type': 'text/plain'
          },
          data: 'foobar',
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: errors.ContentTypeMismatch.code,
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 400 if a malformed command is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: {},
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.CommandMalformed.code,
          message: 'Missing required property: aggregateIdentifier (at requestBody.aggregateIdentifier).'
        });
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          aggregateIdentifier: {
            context: { name: 'nonExistent' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: command,
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.ContextNotFound.code,
          message: `Context 'nonExistent' not found.`
        });
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'nonExistent', id: v4() }
          },
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: command,
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.AggregateNotFound.code,
          message: `Aggregate 'sampleContext.nonExistent' not found.`
        });
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: command,
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.CommandNotFound.code,
          message: `Command 'sampleContext.sampleAggregate.nonExistent' not found.`
        });
      });

      test('returns 400 if a command is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: command,
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.CommandMalformed.code,
          message: 'No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).'
        });
      });

      test('returns 200 if a wellformed and existing command is sent.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
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

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/',
          data: command
        });

        assert.that(status).is.equalTo(200);
      });

      test('receives commands.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
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

        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/',
          data: command
        });

        assert.that(receivedCommands.length).is.equalTo(1);
        assert.that(receivedCommands[0]).is.equalTo(command);
      });

      test('returns the ID of the received command.', async (): Promise<void> => {
        const command = new CommandWithMetadata({
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
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

        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'post',
          url: '/v2/',
          data: command
        });

        assert.that(data).is.equalTo({ id: command.id });
      });

      test('returns 500 if on received command throws an error.', async (): Promise<void> => {
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
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: command,
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
        assert.that(data).is.equalTo({
          code: errors.UnknownError.code,
          message: 'Unknown error.'
        });
      });
    });

    suite('POST /cancel', (): void => {
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

      test('returns 415 if the content-type header is missing.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/cancel',
          headers: {
            'content-type': ''
          },
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            }
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: errors.ContentTypeMismatch.code,
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/cancel',
          headers: {
            'content-type': 'text/plain'
          },
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            }
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: errors.ContentTypeMismatch.code,
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 400 if a malformed command is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/cancel',
          data: {},
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'Missing required property: aggregateIdentifier (at requestBody.aggregateIdentifier).'
        });
      });

      test('returns 400 if a non-existent context name is given.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/cancel',
          data: {
            aggregateIdentifier: {
              context: { name: 'nonExistent' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            }
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.ContextNotFound.code,
          message: `Context 'nonExistent' not found.`
        });
      });

      test('returns 400 if a non-existent aggregate name is given.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/cancel',
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'nonExistent', id: v4() }
            },
            name: 'execute',
            id: v4(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            }
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.AggregateNotFound.code,
          message: `Aggregate 'sampleContext.nonExistent' not found.`
        });
      });

      test('returns 400 if a non-existent command name is given.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/cancel',
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'nonExistent',
            id: v4(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            }
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.CommandNotFound.code,
          message: `Command 'sampleContext.sampleAggregate.nonExistent' not found.`
        });
      });

      test('returns 200 if the command can be cancelled successfully.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/cancel',
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            }
          }
        });

        assert.that(status).is.equalTo(200);
      });

      test('cancels commands.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const commandIdentifierWithClient = {
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: v4() }
          },
          name: 'execute',
          id: v4(),
          client: {
            ip: '127.0.0.1',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            token: '...'
          }
        };

        await client({
          method: 'post',
          url: '/v2/cancel',
          data: commandIdentifierWithClient
        });

        assert.that(cancelledCommands.length).is.equalTo(1);
        assert.that(cancelledCommands[0]).is.equalTo(commandIdentifierWithClient);
      });

      test('returns 500 if on cancel command throws an error.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/cancel',
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4(),
            client: {
              ip: '127.0.0.1',
              user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
              token: '...'
            }
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
        assert.that(data).is.equalTo({
          code: errors.UnknownError.code,
          message: 'Unknown error.'
        });
      });
    });
  });
});

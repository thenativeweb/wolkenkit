import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/handleCommand/http';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';

suite('handleCommand/http', (): void => {
  const identityProviders = [ identityProvider ];

  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      application = await loadApplication({ applicationDirectory });
    });

    suite('GET /description', (): void => {
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

      test('returns 200.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: '/v2/description'
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { headers } = await client({
          method: 'get',
          url: '/v2/description'
        });

        assert.that(headers['content-type']).is.equalTo('application/json; charset=utf-8');
      });

      test('returns the commands description.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/description'
        });

        const { commands: commandsDescription } = getApplicationDescription({
          application
        });

        // Convert and parse as JSON, to get rid of any values that are undefined.
        // This is what the HTTP API does internally, and here we need to simulate
        // this to make things work.
        const expectedCommandsDescription = JSON.parse(JSON.stringify(commandsDescription));

        assert.that(data).is.equalTo(expectedCommandsDescription);
      });
    });

    suite('POST /:contextName/:aggregateName/:aggregateId/:commandName', (): void => {
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

      test('returns 415 if the content-type header is not set to application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/sampleContext/sampleAggregate/${v4()}/execute`,
          headers: {
            'content-type': 'text/plain'
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

      test('returns 400 if the aggregate id is not a uuid.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/nonExistent/sampleAggregate/not-a-uuid/execute`,
          data: { strategy: 'succeed' },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'Value does not satisfy format: uuid (at command.aggregateIdentifier.aggregate.id).'
        });
      });

      test('returns 400 if a non-existent context name is given.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/nonExistent/sampleAggregate/${v4()}/execute`,
          data: { strategy: 'succeed' },
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
          url: `/v2/sampleContext/nonExistent/${v4()}/execute`,
          data: { strategy: 'succeed' },
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
          url: `/v2/sampleContext/sampleAggregate/${v4()}/nonExistent`,
          data: { strategy: 'succeed' },
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
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/sampleContext/sampleAggregate/${v4()}/execute`,
          data: { strategy: 'invalid-value' },
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
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/sampleContext/sampleAggregate/${v4()}/execute`,
          data: { strategy: 'succeed' }
        });

        assert.that(status).is.equalTo(200);
        assert.that(data.id).is.not.undefined();
      });

      test('receives commands.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const id = v4();

        await client({
          method: 'post',
          url: `/v2/sampleContext/sampleAggregate/${id}/execute`,
          data: { strategy: 'succeed' }
        });

        assert.that(receivedCommands.length).is.equalTo(1);
        assert.that(receivedCommands[0]).is.atLeast({
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id }
          },
          name: 'execute',
          data: { strategy: 'succeed' },
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

      test('returns the ID of the received command.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'post',
          url: `/v2/sampleContext/sampleAggregate/${v4()}/execute`,
          data: { strategy: 'succeed' }
        });

        assert.that(data).is.atLeast({
          id: receivedCommands[0].id
        });
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
          application,
          identityProviders
        }));

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/sampleContext/sampleAggregate/${v4()}/execute`,
          data: { strategy: 'succeed' },
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

    suite('POST /:contextName/:aggregateName/:commandName', (): void => {
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

      test('returns 415 if the content-type header is not set to application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/sampleContext/sampleAggregate/execute`,
          headers: {
            'content-type': 'text/plain'
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

      test('returns 400 if a non-existent context name is given.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/nonExistent/sampleAggregate/execute`,
          data: { strategy: 'succeed' },
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
          url: `/v2/sampleContext/nonExistent/execute`,
          data: { strategy: 'succeed' },
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
          url: `/v2/sampleContext/sampleAggregate/nonExistent`,
          data: { strategy: 'succeed' },
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
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/sampleContext/sampleAggregate/execute`,
          data: { strategy: 'invalid-value' },
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
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/sampleContext/sampleAggregate/execute`,
          data: { strategy: 'succeed' }
        });

        assert.that(status).is.equalTo(200);
        assert.that(data.id).is.not.undefined();
        assert.that(data.aggregateIdentifier).is.not.undefined();
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
          application,
          identityProviders
        }));
      });

      test('returns 415 if the content-type header is not set to application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/cancel`,
          headers: {
            'content-type': 'text/plain'
          },
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4()
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

      test('returns 400 if the command identifier is malformed.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/cancel`,
          data: {
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'execute',
            id: v4()
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'Missing required property: context (at requestBody.aggregateIdentifier.context).'
        });
      });

      test('returns 400 if a non-existent context name is given.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/cancel`,
          data: {
            aggregateIdentifier: {
              context: { name: 'nonExistent' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4()
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
          url: `/v2/cancel`,
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'nonExistent', id: v4() }
            },
            name: 'execute',
            id: v4()
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
          url: `/v2/cancel`,
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'nonExistent',
            id: v4()
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

      test('returns 200 if a command can be cancelled successfully.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: `/v2/cancel`,
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4()
          }
        });

        assert.that(status).is.equalTo(200);
      });

      test(`returns 404 if a command can't be found.`, async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveCommand (): Promise<void> {
            // Intentionally left blank.
          },
          async onCancelCommand (): Promise<void> {
            throw new errors.ItemNotFound();
          },
          application,
          identityProviders
        }));

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: `/v2/cancel`,
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4()
          },
          validateStatus: (): boolean => true
        });

        assert.that(status).is.equalTo(404);
      });

      test('returns 200 and cancels the given command.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const aggregateId = v4(),
              commandId = v4();

        const { status } = await client({
          method: 'post',
          url: `/v2/cancel`,
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'execute',
            id: commandId
          }
        });

        assert.that(status).is.equalTo(200);
        assert.that(cancelledCommands.length).is.equalTo(1);
        assert.that(cancelledCommands[0]).is.atLeast({
          aggregateIdentifier: {
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId }
          },
          name: 'execute',
          id: commandId,
          client: {
            user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' }}
          }
        });
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
          application,
          identityProviders
        }));

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/cancel`,
          data: {
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'execute',
            id: v4()
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

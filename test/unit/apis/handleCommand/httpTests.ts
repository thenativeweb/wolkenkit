import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { AxiosError } from 'axios';
import { Command } from '../../../../lib/common/elements/Command';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { getApi } from '../../../../lib/apis/handleCommand/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { runAsServer } from '../../../shared/http/runAsServer';
import { uuid } from 'uuidv4';

suite('handleCommand/http', (): void => {
  const identityProviders = [ identityProvider ];

  let applicationDefinition: ApplicationDefinition;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      applicationDefinition = await getApplicationDefinition({ applicationDirectory });
    });

    suite('GET /description', (): void => {
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

      test('returns 200.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: '/v2/description'
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns application/json.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { headers } = await client({
          method: 'get',
          url: '/v2/description'
        });

        assert.that(headers['content-type']).is.equalTo('application/json; charset=utf-8');
      });

      test('returns the commands description.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/description'
        });

        const { commands: commandsDescription } = getApplicationDescription({
          applicationDefinition
        });

        // Convert and parse as JSON, to get rid of any values that are undefined.
        // This is what the HTTP API does internally, and here we need to simulate
        // this to make things work.
        const expectedCommandsDescription =
          JSON.parse(JSON.stringify(commandsDescription));

        assert.that(data).is.equalTo(expectedCommandsDescription);
      });
    });

    suite('POST /', (): void => {
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

      test('returns 415 if the content-type header is missing.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        await assert.that(async (): Promise<void> => {
          await client({
            method: 'post',
            url: '/v2/',
            headers: {
              'content-type': ''
            },
            responseType: 'text'
          });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as AxiosError).response!.status === 415 &&
            (ex as AxiosError).response!.data === 'Header content-type must be application/json.'
        );
      });

      test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        await assert.that(async (): Promise<void> => {
          await client({
            method: 'post',
            url: '/v2/',
            headers: {
              'content-type': 'text/plain'
            },
            responseType: 'text'
          });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as AxiosError).response!.status === 415 &&
            (ex as AxiosError).response!.data === 'Header content-type must be application/json.'
        );
      });

      test('returns 400 if a malformed command is sent.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        await assert.that(async (): Promise<void> => {
          await client({
            method: 'post',
            url: '/v2/',
            data: { foo: 'bar' },
            responseType: 'text'
          });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as AxiosError).response!.status === 400 &&
            (ex as AxiosError).response!.data === 'Invalid type: undefined should be object (at command.data).'
        );
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const client = await runAsServer({ app: api });

        await assert.that(async (): Promise<void> => {
          await client({
            method: 'post',
            url: '/v2/',
            data: command,
            responseType: 'text'
          });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as AxiosError).response!.status === 400 &&
            (ex as AxiosError).response!.data === `Context 'nonExistent' not found.`
        );
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const client = await runAsServer({ app: api });

        await assert.that(async (): Promise<void> => {
          await client({
            method: 'post',
            url: '/v2/',
            data: command,
            responseType: 'text'
          });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as AxiosError).response!.status === 400 &&
            (ex as AxiosError).response!.data === `Aggregate 'sampleContext.nonExistent' not found.`
        );
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' }
        });

        const client = await runAsServer({ app: api });

        await assert.that(async (): Promise<void> => {
          await client({
            method: 'post',
            url: '/v2/',
            data: command,
            responseType: 'text'
          });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as AxiosError).response!.status === 400 &&
            (ex as AxiosError).response!.data === `Command 'sampleContext.sampleAggregate.nonExistent' not found.`
        );
      });

      test('returns 400 if a command is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'invalid-value' }
        });

        const client = await runAsServer({ app: api });

        await assert.that(async (): Promise<void> => {
          await client({
            method: 'post',
            url: '/v2/',
            data: command,
            responseType: 'text'
          });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as AxiosError).response!.status === 400 &&
            (ex as AxiosError).response!.data === 'No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).'
        );
      });

      test('returns 200 if a wellformed and existing command is sent.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const client = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/',
          data: command
        });

        assert.that(status).is.equalTo(200);
      });

      test('receives commands.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const client = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/',
          data: command
        });

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

      test('returns the ID of the received command.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const client = await runAsServer({ app: api });

        const { data } = await client({
          method: 'post',
          url: '/v2/',
          data: command
        });

        assert.that(data).is.equalTo({
          id: receivedCommands[0].id
        });
      });

      test('returns 500 if on received command throws an error.', async (): Promise<void> => {
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

        const client = await runAsServer({ app: api });

        await assert.that(async (): Promise <void> => {
          await client({
            method: 'post',
            url: '/v2/',
            data: command
          });
        }).is.throwingAsync((ex): boolean => (ex as AxiosError).response?.status === 500);
      });
    });
  });
});

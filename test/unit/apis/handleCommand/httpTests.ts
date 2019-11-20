import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { Command } from '../../../../lib/common/elements/Command';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { getApi } from '../../../../lib/apis/handleCommand/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { uuid } from 'uuidv4';
import supertest, { Response } from 'supertest';

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
        await supertest(api).
          get('/v2/description').
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
          });
      });

      test('returns application/json.', async (): Promise<void> => {
        await supertest(api).
          get('/v2/description').
          expect((res: Response): void => {
            assert.that(res.header['content-type']).is.equalTo('application/json; charset=utf-8');
          });
      });

      test('returns the commands description.', async (): Promise<void> => {
        await supertest(api).
          get('/v2/description').
          expect((res: Response): void => {
            const { commands: commandsDescription } = getApplicationDescription({
              applicationDefinition
            });

            // Convert and parse as JSON, to get rid of any values that are undefined.
            // This is what the HTTP API does internally, and here we need to simulate
            // this to make things work.
            const expectedCommandsDescription =
            JSON.parse(JSON.stringify(commandsDescription));

            assert.that(res.body).is.equalTo(expectedCommandsDescription);
          });
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
        await supertest(api).
          post('/v2/').
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(415);
            assert.that(res.text).is.equalTo('Header content-type must be application/json.');
          });
      });

      test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
        await supertest(api).
          post('/v2/').
          set({
            'content-type': 'text/plain'
          }).
          send('foobar').
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(415);
            assert.that(res.text).is.equalTo('Header content-type must be application/json.');
          });
      });

      test('returns 400 if a malformed command is sent.', async (): Promise<void> => {
        await supertest(api).
          post('/v2/').
          send({ foo: 'bar' }).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid type: undefined should be object (at command.data).');
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo(`Context 'nonExistent' not found.`);
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo(`Aggregate 'sampleContext.nonExistent' not found.`);
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' }
        });

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo(`Command 'sampleContext.sampleAggregate.nonExistent' not found.`);
          });
      });

      test('returns 400 if a command is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'invalid-value' }
        });

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).');
          });
      });

      test('returns 200 if a wellformed and existing command is sent.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
          });
      });

      test('receives commands.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(api).
          post('/v2/').
          send(command);

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

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.body).is.equalTo({
              id: receivedCommands[0].id
            });
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

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(500);
          });
      });
    });
  });
});

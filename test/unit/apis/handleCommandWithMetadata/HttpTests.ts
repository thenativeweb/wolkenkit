import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { getApi } from '../../../../lib/apis/handleCommandWithMetadata/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { uuid } from 'uuidv4';
import supertest, { Response } from 'supertest';

suite('handleCommandWithMetadata/http', (): void => {
  let applicationDefinition: ApplicationDefinition;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      applicationDefinition = await getApplicationDefinition({ applicationDirectory });
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
          applicationDefinition
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
            assert.that(res.text).is.equalTo('Invalid type: undefined should be object (at command.metadata).');
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', async (): Promise<void> => {
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

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo(`Context 'nonExistent' not found.`);
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', async (): Promise<void> => {
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

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo(`Aggregate 'sampleContext.nonExistent' not found.`);
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', async (): Promise<void> => {
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

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo(`Command 'sampleContext.sampleAggregate.nonExistent' not found.`);
          });
      });

      test('returns 400 if a command is sent with a payload that does not match the schema.', async (): Promise<void> => {
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

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).');
          });
      });

      test('returns 200 if a wellformed and existing command is sent.', async (): Promise<void> => {
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

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
          });
      });

      test('receives commands.', async (): Promise<void> => {
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

        await supertest(api).
          post('/v2/').
          send(command);

        assert.that(receivedCommands.length).is.equalTo(1);
        assert.that(receivedCommands[0]).is.equalTo(command);
      });

      test('returns the ID of the received command.', async (): Promise<void> => {
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

        await supertest(api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.body).is.equalTo({ id: command.id });
          });
      });

      test('returns 500 if on received command throws an error.', async (): Promise<void> => {
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

import Application from '../../../../src/common/application';
import assert from 'assertthat';
import CommandExternal from '../../../../src/common/elements/CommandExternal';
import CommandInternal from '../../../../src/common/elements/CommandInternal';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import Http from '../../../../src/apis/command/Http';
import identityProvider from '../../../shared/identityProvider';
import InMemoryEventstore from '../../../../src/stores/eventstore/InMemory';
import path from 'path';
import uuid from 'uuidv4';
import supertest, { Response } from 'supertest';

suite('command/Http', (): void => {
  const identityProviders = [ identityProvider ];
  let application: Application,
      eventstore: Eventstore;

  setup(async (): Promise<void> => {
    const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

    application = await Application.load({ directory });

    eventstore = new InMemoryEventstore();
    await eventstore.create();
  });

  teardown(async (): Promise<void> => {
    await eventstore.destroy();
  });

  test('is a function.', async (): Promise<void> => {
    assert.that(Http).is.ofType('function');
  });

  suite('initialize', (): void => {
    test('sets api to an Express application.', async (): Promise<void> => {
      const http = await Http.create({
        corsOrigin: '*',
        purpose: 'external',
        async onReceiveCommand (): Promise<void> {
          // Intentionally left blank.
        },
        application,
        identityProviders
      });

      assert.that(http.api).is.ofType('function');
    });
  });

  suite('CORS', (): void => {
    const corsOrigins = [
      {
        title: 'returns * if anything is allowed.',
        origin: 'http://www.thenativeweb.io',
        allow: '*',
        expected: '*'
      },
      {
        title: 'returns origin if origin is allowed.',
        origin: 'http://www.thenativeweb.io',
        allow: 'http://www.thenativeweb.io',
        expected: 'http://www.thenativeweb.io'
      },
      {
        title: 'returns origin if origin is allowed by a regular expression.',
        origin: 'http://www.thenativeweb.io',
        allow: /\.thenativeweb\.io$/u,
        expected: 'http://www.thenativeweb.io'
      },
      {
        title: 'returns origin if origin is one of multiple allowed.',
        origin: 'http://www.thenativeweb.io',
        allow: [ 'http://www.thenativeweb.io', 'http://www.example.com' ],
        expected: 'http://www.thenativeweb.io'
      },
      {
        title: 'returns undefined if origin is not allowed.',
        origin: 'http://www.example.com',
        allow: 'http://www.thenativeweb.io',
        expected: undefined
      },
      {
        title: 'returns undefined if origin is not allowed by a regular expression.',
        origin: 'http://www.example.com',
        allow: /\.thenativeweb\.io$/u,
        expected: undefined
      }
    ];

    for (const corsOrigin of corsOrigins) {
      /* eslint-disable no-loop-func */
      test(corsOrigin.title, async (): Promise<void> => {
        const http = await Http.create({
          corsOrigin: corsOrigin.allow,
          purpose: 'external',
          async onReceiveCommand (): Promise<void> {
            // Intentionally left blank.
          },
          application,
          identityProviders
        });

        await supertest(http.api).
          options('/').
          set({
            origin: corsOrigin.origin,
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'X-Requested-With'
          }).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
            assert.that(res.header['access-control-allow-origin']).is.equalTo(corsOrigin.expected);
            assert.that(res.header['access-control-allow-methods']).is.equalTo('GET,POST');
          });
      });
      /* eslint-enable no-loop-func */
    }
  });

  suite('GET /v2/configuration', (): void => {
    let http: Http;

    setup(async (): Promise<void> => {
      http = await Http.create({
        corsOrigin: '*',
        purpose: 'external',
        async onReceiveCommand (): Promise<void> {
          // Intentionally left blank.
        },
        application,
        identityProviders
      });
    });

    test('returns 200.', async (): Promise<void> => {
      await supertest(http.api).
        get('/v2/configuration').
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(200);
        });
    });

    test('returns application/json.', async (): Promise<void> => {
      await supertest(http.api).
        get('/v2/configuration').
        expect((res: Response): void => {
          assert.that(res.header['content-type']).is.equalTo('application/json; charset=utf-8');
        });
    });

    test('serves the command configuration.', async (): Promise<void> => {
      await supertest(http.api).
        get('/v2/configuration').
        expect((res: Response): void => {
          const commands = application.commands.external;

          // Convert and parse as JSON, to get rid of any values that are undefined.
          // This is what the HTTP API does internally, and here we need to simulate
          // this to make things work.
          const expectedConfiguration = JSON.parse(JSON.stringify(commands));

          assert.that(res.body).is.equalTo(expectedConfiguration);
        });
    });
  });

  suite('POST /v2/', (): void => {
    suite('receiving external commands', (): void => {
      let http: Http,
          receivedCommands: CommandInternal[];

      setup(async (): Promise<void> => {
        receivedCommands = [];

        http = await Http.create({
          corsOrigin: '*',
          purpose: 'external',
          async onReceiveCommand ({ command }: { command: CommandInternal}): Promise<void> {
            receivedCommands.push(command);
          },
          application,
          identityProviders
        });
      });

      test('returns 415 if the content-type header is missing.', async (): Promise<void> => {
        await supertest(http.api).
          post('/v2/').
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(415);
            assert.that(res.text).is.equalTo('Header content-type must be application/json.');
          });
      });

      test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
        await supertest(http.api).
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
        await supertest(http.api).
          post('/v2/').
          send({ foo: 'bar' }).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Command malformed.');
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', async (): Promise<void> => {
        const command = CommandExternal.create({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid context name.');
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const command = CommandExternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid aggregate name.');
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', async (): Promise<void> => {
        const command = CommandExternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid command name.');
          });
      });

      test('returns 400 if a command is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const command = CommandExternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'invalid-value' }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).');
          });
      });

      test('returns 200 if a wellformed and existing command is sent.', async (): Promise<void> => {
        const command = CommandExternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
          });
      });

      test('receives commands.', async (): Promise<void> => {
        const command = CommandExternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(receivedCommands.length).is.equalTo(1);
        assert.that(receivedCommands[0]).is.atLeast({
          contextIdentifier: command.contextIdentifier,
          aggregateIdentifier: command.aggregateIdentifier,
          name: command.name,
          id: command.id,
          data: command.data,
          metadata: {
            causationId: command.id,
            correlationId: command.id
          },
          annotations: {
            client: {
              user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' }}
            },
            initiator: {
              user: { id: 'anonymous', claims: { sub: 'anonymous', iss: 'https://token.invalid' }}
            }
          }
        });

        assert.that(receivedCommands[0].annotations.client.token).is.ofType('string');
        assert.that(receivedCommands[0].annotations.client.ip).is.ofType('string');
      });

      test('returns 500 if on received command throws an error.', async (): Promise<void> => {
        http = await Http.create({
          corsOrigin: '*',
          purpose: 'external',
          async onReceiveCommand (): Promise<void> {
            throw new Error('Failed to handle received command.');
          },
          application,
          identityProviders
        });

        const command = CommandExternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(500);
          });
      });
    });

    suite('receiving internal commands', (): void => {
      let http: Http,
          receivedCommands: CommandInternal[];

      setup(async (): Promise<void> => {
        receivedCommands = [];

        http = await Http.create({
          corsOrigin: '*',
          purpose: 'internal',
          async onReceiveCommand ({ command }: { command: CommandInternal}): Promise<void> {
            receivedCommands.push(command);
          },
          application,
          identityProviders
        });
      });

      test('returns 415 if the content-type header is missing.', async (): Promise<void> => {
        await supertest(http.api).
          post('/v2/').
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(415);
            assert.that(res.text).is.equalTo('Header content-type must be application/json.');
          });
      });

      test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
        await supertest(http.api).
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
        await supertest(http.api).
          post('/v2/').
          send({ foo: 'bar' }).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Command malformed.');
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', async (): Promise<void> => {
        const command = CommandInternal.create({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          annotations: {
            client: {
              token: '...',
              user: { id: uuid(), claims: { sub: uuid() }},
              ip: '127.0.0.1'
            },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid context name.');
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const command = CommandInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          annotations: {
            client: {
              token: '...',
              user: { id: uuid(), claims: { sub: uuid() }},
              ip: '127.0.0.1'
            },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid aggregate name.');
          });
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', async (): Promise<void> => {
        const command = CommandInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' },
          annotations: {
            client: {
              token: '...',
              user: { id: uuid(), claims: { sub: uuid() }},
              ip: '127.0.0.1'
            },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid command name.');
          });
      });

      test('returns 400 if a command is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const command = CommandInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'invalid-value' },
          annotations: {
            client: {
              token: '...',
              user: { id: uuid(), claims: { sub: uuid() }},
              ip: '127.0.0.1'
            },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).');
          });
      });

      test('returns 200 if a wellformed and existing command is sent.', async (): Promise<void> => {
        const command = CommandInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          annotations: {
            client: {
              token: '...',
              user: { id: uuid(), claims: { sub: uuid() }},
              ip: '127.0.0.1'
            },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
          });
      });

      test('receives commands and does not overwrite the annotations.', async (): Promise<void> => {
        const command = CommandInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          annotations: {
            client: {
              token: '...',
              user: { id: uuid(), claims: { sub: uuid() }},
              ip: '127.0.0.1'
            },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
        });

        await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(receivedCommands.length).is.equalTo(1);
        assert.that(receivedCommands[0]).is.atLeast({
          contextIdentifier: command.contextIdentifier,
          aggregateIdentifier: command.aggregateIdentifier,
          name: command.name,
          id: command.id,
          data: command.data,
          metadata: {
            causationId: command.id,
            correlationId: command.id
          },
          annotations: command.annotations
        });
      });

      test('returns 500 if on received command throws an error.', async (): Promise<void> => {
        http = await Http.create({
          corsOrigin: '*',
          purpose: 'internal',
          async onReceiveCommand (): Promise<void> {
            throw new Error('Failed to handle received command.');
          },
          application,
          identityProviders
        });

        const command = CommandInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          annotations: {
            client: {
              token: '...',
              user: { id: uuid(), claims: { sub: uuid() }},
              ip: '127.0.0.1'
            },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
        });

        await supertest(http.api).
          post('/v2/').
          send(command).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(500);
          });
      });
    });
  });
});

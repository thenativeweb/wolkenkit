'use strict';

const path = require('path');

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      supertest = require('supertest'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { CommandExternal, CommandInternal } = require('../../../../common/elements'),
      { Http } = require('../../../../apis/command'),
      identityProvider = require('../../../shared/identityProvider'),
      { InMemory } = require('../../../../stores/eventstore');

suite('command/Http', () => {
  const identityProviders = [ identityProvider ];
  let application,
      eventstore,
      http;

  setup(async () => {
    const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

    application = await Application.load({ directory });

    eventstore = new InMemory();
    await eventstore.initialize();

    http = new Http();
  });

  teardown(async () => {
    await eventstore.destroy();
  });

  test('is a function.', async () => {
    assert.that(Http).is.ofType('function');
  });

  suite('initialize', () => {
    test('is a function.', async () => {
      assert.that(http.initialize).is.ofType('function');
    });

    getOptionTests({
      options: {
        corsOrigin: '*',
        purpose: 'external',
        async onReceiveCommand () {
          // Intentionally left blank.
        },
        application: {},
        identityProviders
      },
      exclude: [ 'identityProviders.*' ],
      async run (options) {
        await http.initialize(options);
      }
    });

    test('throws an error if an invalid purpose is given.', async () => {
      await assert.that(async () => {
        await http.initialize({
          corsOrigin: '*',
          purpose: 'invalid',
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          identityProviders
        });
      }).is.throwingAsync(`Purpose must either be 'internal' or 'external'.`);
    });

    test('sets api to an Express application.', async () => {
      assert.that(http.api).is.undefined();

      await http.initialize({
        corsOrigin: '*',
        purpose: 'external',
        async onReceiveCommand () {
          // Intentionally left blank.
        },
        application,
        identityProviders
      });

      assert.that(http.api).is.ofType('function');
    });
  });

  suite('CORS', () => {
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
      test(corsOrigin.title, async () => {
        await http.initialize({
          corsOrigin: corsOrigin.allow,
          purpose: 'external',
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          identityProviders
        });

        const res = await supertest(http.api).
          options('/').
          set({
            origin: corsOrigin.origin,
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'X-Requested-With'
          });

        assert.that(res.statusCode).is.equalTo(200);
        assert.that(res.headers['access-control-allow-origin']).is.equalTo(corsOrigin.expected);
        assert.that(res.headers['access-control-allow-methods']).is.equalTo('GET,POST');
      });
      /* eslint-enable no-loop-func */
    }
  });

  suite('GET /v2/configuration', () => {
    setup(async () => {
      await http.initialize({
        corsOrigin: '*',
        purpose: 'external',
        async onReceiveCommand () {
          // Intentionally left blank.
        },
        application,
        identityProviders
      });
    });

    test('returns 200.', async () => {
      const res = await supertest(http.api).get('/v2/configuration');

      assert.that(res.statusCode).is.equalTo(200);
    });

    test('returns application/json.', async () => {
      const res = await supertest(http.api).get('/v2/configuration');

      assert.that(res.headers['content-type']).is.equalTo('application/json; charset=utf-8');
    });

    test('serves the command configuration.', async () => {
      const res = await supertest(http.api).get('/v2/configuration');

      const commands = application.commands.external;

      // Convert and parse as JSON, to get rid of any values that are undefined.
      // This is what the HTTP API does internally, and here we need to simulate
      // this to make things work.
      const expectedConfiguration = JSON.parse(JSON.stringify(commands));

      assert.that(res.body).is.equalTo(expectedConfiguration);
    });
  });

  suite('POST /v2/', () => {
    suite('receiving external commands', () => {
      let receivedCommands;

      setup(async () => {
        http = new Http();
        receivedCommands = [];

        await http.initialize({
          corsOrigin: '*',
          purpose: 'external',
          async onReceiveCommand ({ command }) {
            receivedCommands.push(command);
          },
          application,
          identityProviders
        });
      });

      test('returns 415 if the content-type header is missing.', async () => {
        const res = await supertest(http.api).post('/v2/');

        assert.that(res.statusCode).is.equalTo(415);
        assert.that(res.text).is.equalTo('Header content-type must be application/json.');
      });

      test('returns 415 if content-type is not set to application/json.', async () => {
        const res = await supertest(http.api).
          post('/v2/').
          set({
            'content-type': 'text/plain'
          }).
          send('foobar');

        assert.that(res.statusCode).is.equalTo(415);
        assert.that(res.text).is.equalTo('Header content-type must be application/json.');
      });

      test('returns 400 if a malformed command is sent.', async () => {
        const res = await supertest(http.api).
          post('/v2/').
          send({ foo: 'bar' });

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('Malformed command.');
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', async () => {
        const command = CommandExternal.create({
          context: { name: 'nonExistent' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('Invalid context name.');
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', async () => {
        const command = CommandExternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'nonExistent', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('Invalid aggregate name.');
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', async () => {
        const command = CommandExternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' }
        });

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('Invalid command name.');
      });

      test('returns 400 if a command is sent with a payload that does not match the schema.', async () => {
        const command = CommandExternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'invalid-value' }
        });

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).');
      });

      test('returns 200 if a wellformed and existing command is sent.', async () => {
        const command = CommandExternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { statusCode } = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(statusCode).is.equalTo(200);
      });

      test('receives commands.', async () => {
        const command = CommandExternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(receivedCommands.length).is.equalTo(1);
        assert.that(receivedCommands[0]).is.atLeast({
          context: { name: command.context.name },
          aggregate: { name: command.aggregate.name, id: command.aggregate.id },
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

      test('returns 500 if on received command throws an error.', async () => {
        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          purpose: 'external',
          async onReceiveCommand () {
            throw new Error('Failed to handle received command.');
          },
          application,
          identityProviders
        });

        const command = CommandExternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { statusCode } = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(statusCode).is.equalTo(500);
      });
    });

    suite('receiving internal commands', () => {
      let receivedCommands;

      setup(async () => {
        http = new Http();
        receivedCommands = [];

        await http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          async onReceiveCommand ({ command }) {
            receivedCommands.push(command);
          },
          application,
          identityProviders
        });
      });

      test('returns 415 if the content-type header is missing.', async () => {
        const res = await supertest(http.api).post('/v2/');

        assert.that(res.statusCode).is.equalTo(415);
        assert.that(res.text).is.equalTo('Header content-type must be application/json.');
      });

      test('returns 415 if content-type is not set to application/json.', async () => {
        const res = await supertest(http.api).
          post('/v2/').
          set({
            'content-type': 'text/plain'
          }).
          send('foobar');

        assert.that(res.statusCode).is.equalTo(415);
        assert.that(res.text).is.equalTo('Header content-type must be application/json.');
      });

      test('returns 400 if a malformed command is sent.', async () => {
        const res = await supertest(http.api).
          post('/v2/').
          send({ foo: 'bar' });

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('Malformed command.');
      });

      test('returns 400 if a wellformed command is sent with a non-existent context name.', async () => {
        const command = CommandInternal.create({
          context: { name: 'nonExistent' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
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

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('Invalid context name.');
      });

      test('returns 400 if a wellformed command is sent with a non-existent aggregate name.', async () => {
        const command = CommandInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'nonExistent', id: uuid() },
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

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('Invalid aggregate name.');
      });

      test('returns 400 if a wellformed command is sent with a non-existent command name.', async () => {
        const command = CommandInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
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

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('Invalid command name.');
      });

      test('returns 400 if a command is sent with a payload that does not match the schema.', async () => {
        const command = CommandInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
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

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(400);
        assert.that(res.text).is.equalTo('No enum match (invalid-value), expects: succeed, fail, reject (at command.data.strategy).');
      });

      test('returns 200 if a wellformed and existing command is sent.', async () => {
        const command = CommandInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
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

        const { statusCode } = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(statusCode).is.equalTo(200);
      });

      test('receives commands and does not overwrite the annotations.', async () => {
        const command = CommandInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
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
          context: { name: command.context.name },
          aggregate: { name: command.aggregate.name, id: command.aggregate.id },
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

      test('returns 500 if on received command throws an error.', async () => {
        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          async onReceiveCommand () {
            throw new Error('Failed to handle received command.');
          },
          application,
          identityProviders
        });

        const command = CommandInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
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

        const { statusCode } = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(statusCode).is.equalTo(500);
      });
    });
  });
});

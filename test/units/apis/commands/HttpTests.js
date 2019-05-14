'use strict';

const path = require('path');

const assert = require('assertthat'),
      record = require('record-stdstreams'),
      supertest = require('supertest'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { Command, Event } = require('../../../../common/elements'),
      commandIsAuthorized = require('../../../shared/applications/valid/commandIsAuthorized'),
      { Http } = require('../../../../apis/commands'),
      identityProvider = require('../../../shared/identityProvider'),
      { InMemory } = require('../../../../stores/eventstore'),
      { Repository } = require('../../../../common/domain');

suite('commands/Http', () => {
  const identityProviders = [ identityProvider ];
  let application,
      eventstore,
      repository;

  setup(async () => {
    const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

    eventstore = new InMemory();
    await eventstore.initialize();

    application = await Application.load({ directory });
    repository = new Repository({ application, eventstore });
  });

  teardown(async () => {
    await eventstore.destroy();
  });

  test('is a function.', async () => {
    assert.that(Http).is.ofType('function');
  });

  suite('initialize', () => {
    test('is a function.', async () => {
      const http = new Http();

      assert.that(http.initialize).is.ofType('function');
    });

    test('throws an error if CORS origin is missing.', async () => {
      const http = new Http();

      await assert.that(async () => {
        await http.initialize({
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });
      }).is.throwingAsync('CORS origin is missing.');
    });

    test('throws an error if on receive command is missing.', async () => {
      const http = new Http();

      await assert.that(async () => {
        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });
      }).is.throwingAsync('On receive command is missing.');
    });

    test('throws an error if application is missing.', async () => {
      const http = new Http();

      await assert.that(async () => {
        await http.initialize({
          corsOrigin: '*',
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          repository,
          identityProviders
        });
      }).is.throwingAsync('Application is missing.');
    });

    test('throws an error if repository is missing.', async () => {
      const http = new Http();

      await assert.that(async () => {
        await http.initialize({
          corsOrigin: '*',
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          identityProviders
        });
      }).is.throwingAsync('Repository is missing.');
    });

    test('throws an error if identity providers are missing.', async () => {
      const http = new Http();

      await assert.that(async () => {
        await http.initialize({
          corsOrigin: '*',
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          repository
        });
      }).is.throwingAsync('Identity providers are missing.');
    });

    test('sets api to an Express application.', async () => {
      const http = new Http();

      assert.that(http.api).is.undefined();

      await http.initialize({
        corsOrigin: '*',
        async onReceiveCommand () {
          // Intentionally left blank.
        },
        application,
        repository,
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
        allow: /\.thenativeweb\.io$/,
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
        allow: /\.thenativeweb\.io$/,
        expected: undefined
      }
    ];

    for (const corsOrigin of corsOrigins) {
      /* eslint-disable no-loop-func */
      test(corsOrigin.title, async () => {
        const http = new Http();

        await http.initialize({
          corsOrigin: corsOrigin.allow,
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          repository,
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
    let http;

    setup(async () => {
      http = new Http();

      await http.initialize({
        corsOrigin: '*',
        async onReceiveCommand () {
          // Intentionally left blank.
        },
        application,
        repository,
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

    test('serves the commands configuration.', async () => {
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
    let http,
        receivedCommands;

    setup(async () => {
      http = new Http();
      receivedCommands = [];

      await http.initialize({
        corsOrigin: '*',
        async onReceiveCommand ({ command, metadata }) {
          receivedCommands.push({ command, metadata });
        },
        application,
        repository,
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
      const command = new Command({
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
      const command = new Command({
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
      const command = new Command({
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
      const command = new Command({
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
      const command = new Command({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      const res = await supertest(http.api).
        post('/v2/').
        send(command);

      assert.that(res.statusCode).is.equalTo(200);
    });

    test('receives commands.', async () => {
      const command = new Command({
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
        command: {
          context: { name: command.context.name },
          aggregate: { name: command.aggregate.name, id: command.aggregate.id },
          name: command.name,
          data: command.data,
          initiator: {
            id: 'anonymous',
            token: { sub: 'anonymous', iss: 'https://token.invalid' }
          }
        },
        metadata: {
          client: {
            user: { id: 'anonymous', token: { sub: 'anonymous' }}
          }
        }
      });
      assert.that(receivedCommands[0].metadata.client.ip).is.ofType('string');
    });

    suite('isAuthorized', () => {
      test('returns 401 if a command is not authorized.', async () => {
        const directory = await commandIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });

        const command = new Command({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'denyAuthorization'
        });

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(401);
      });

      test('returns 401 if an error is thrown.', async () => {
        const directory = await commandIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });

        const command = new Command({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'failToAuthorize'
        });

        const res = await supertest(http.api).
          post('/v2/').
          send(command);

        assert.that(res.statusCode).is.equalTo(401);
      });

      test('does not mutate the command.', async () => {
        const directory = await commandIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          async onReceiveCommand ({ command, metadata }) {
            receivedCommands.push({ command, metadata });
          },
          application,
          repository,
          identityProviders
        });

        const authorizeWithMutation = new Command({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'authorizeWithMutation'
        });

        await supertest(http.api).
          post('/v2/').
          send(authorizeWithMutation);

        assert.that(receivedCommands.length).is.equalTo(1);
        assert.that(receivedCommands[0].command.data).is.equalTo(authorizeWithMutation.data);
      });

      test('uses the app service.', async () => {
        const directory = await commandIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });

        const otherAggregateId = uuid();

        const succeeded = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: otherAggregateId },
          name: 'succeeded',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const executed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: otherAggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        succeeded.metadata.revision = 1;
        executed.metadata.revision = 2;

        await eventstore.saveEvents({
          uncommittedEvents: [
            { event: succeeded, state: {}},
            { event: executed, state: {}}
          ]
        });

        const command = new Command({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'useApp',
          data: { otherAggregateId }
        });

        const stop = record();

        await supertest(http.api).
          post('/v2/').
          send(command);

        const { stdout } = stop();
        const message = JSON.parse(stdout);

        assert.that(message).is.equalTo({
          id: otherAggregateId,
          state: {}
        });
      });

      test('uses the client service.', async () => {
        const directory = await commandIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          async onReceiveCommand () {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });

        const command = new Command({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'useClient'
        });

        const stop = record();

        await supertest(http.api).
          post('/v2/').
          send(command);

        const { stdout } = stop();
        const message = JSON.parse(stdout);

        assert.that(message).is.atLeast({
          user: {
            id: 'anonymous',
            token: {
              iss: 'https://token.invalid',
              sub: 'anonymous'
            }
          }
        });
        assert.that(message.ip).is.ofType('string');
        assert.that(message.ip.length).is.atLeast(1);
      });

      for (const logLevel of [ 'fatal', 'error', 'warn', 'info', 'debug' ]) {
        /* eslint-disable no-loop-func */
        test(`uses the logger service with log level '${logLevel}'.`, async () => {
          const directory = await commandIsAuthorized();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = new Http();

          await http.initialize({
            corsOrigin: '*',
            async onReceiveCommand () {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const command = new Command({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'useLogger',
            data: { logLevel }
          });

          const stop = record();

          await supertest(http.api).
            post('/v2/').
            send(command);

          const { stdout } = stop();
          const message = JSON.parse(stdout);

          assert.that(message).is.atLeast({
            level: logLevel,
            message: 'Some log message.',
            source: '/server/domain/sampleContext/sampleAggregate.js'
          });
        });
        /* eslint-enable no-loop-func */
      }
    });
  });
});

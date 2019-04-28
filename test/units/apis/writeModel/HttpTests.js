'use strict';

const path = require('path'),
      { Writable } = require('stream');

const assert = require('assertthat'),
      supertest = require('supertest'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { Command, Event } = require('../../../../common/elements'),
      commandFailsToAuthorize = require('../../../shared/applications/valid/commandFailsToAuthorize'),
      commandIsNotAuthorized = require('../../../shared/applications/valid/commandIsNotAuthorized'),
      eventstore = require('../../../../storage/eventstore/inmemory'),
      { Http } = require('../../../../apis/writeModel'),
      identityProvider = require('../../../shared/identityProvider'),
      { Repository } = require('../../../../handlers/writeModel');

const asJsonStream = function (...handleJson) {
  let counter = 0;

  return new Writable({
    write (chunk, encoding, callback) {
      const data = JSON.parse(chunk.toString());

      if (!handleJson[counter]) {
        return callback(new Error(`Received ${counter + 1} items, but only expected ${handleJson.length}.`));
      }

      handleJson[counter](data);

      counter += 1;
      callback();
    }
  });
};

suite('Http', () => {
  const identityProviders = [ identityProvider ];
  let application,
      repository;

  setup(async () => {
    const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

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
          application,
          repository,
          identityProviders
        });
      }).is.throwingAsync('CORS origin is missing.');
    });

    test('throws an error if application is missing.', async () => {
      const http = new Http();

      await assert.that(async () => {
        await http.initialize({
          corsOrigin: '*',
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

    test('serves the application configuration.', async () => {
      const res = await supertest(http.api).get('/v2/configuration');

      const { writeModel } = application.configuration;

      // Convert and parse as JSON, to get rid of any values that are undefined.
      // This is what the HTTP API does internally, and here we need to simulate
      // this to make things work.
      const expectedConfiguration = JSON.parse(JSON.stringify(writeModel));

      assert.that(res.body).is.equalTo(expectedConfiguration);
    });
  });

  suite('POST /v2/command', () => {
    let http;

    setup(async () => {
      http = new Http();

      await http.initialize({
        corsOrigin: '*',
        application,
        repository,
        identityProviders
      });
    });

    test('returns 415 if the content-type header is missing.', async () => {
      const res = await supertest(http.api).post('/v2/command');

      assert.that(res.statusCode).is.equalTo(415);
      assert.that(res.text).is.equalTo('Header content-type must be application/json.');
    });

    test('returns 415 if content-type is not set to application/json.', async () => {
      const res = await supertest(http.api).
        post('/v2/command').
        set({
          'content-type': 'text/plain'
        }).
        send('foobar');

      assert.that(res.statusCode).is.equalTo(415);
      assert.that(res.text).is.equalTo('Header content-type must be application/json.');
    });

    test('returns 400 if a malformed command is sent.', async () => {
      const res = await supertest(http.api).
        post('/v2/command').
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
        post('/v2/command').
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
        post('/v2/command').
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
        post('/v2/command').
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
        post('/v2/command').
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
        post('/v2/command').
        send(command);

      assert.that(res.statusCode).is.equalTo(200);
    });

    test('writes an incoming command to the command stream.', async () => {
      const command = new Command({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      process.nextTick(async () => {
        await supertest(http.api).
          post('/v2/command').
          send(command);
      });

      await new Promise((resolve, reject) => {
        http.commandStream.once('data', data => {
          try {
            assert.that(data).is.atLeast({
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
            assert.that(data.metadata.client.ip).is.ofType('string');

            resolve();
          } catch (ex) {
            return reject(ex);
          }
        });
      });
    });

    test('returns 401 if a command is not authorized.', async () => {
      const directory = await commandIsNotAuthorized();

      application = await Application.load({ directory });
      repository = new Repository({ application, eventstore });

      http = new Http();

      await http.initialize({
        corsOrigin: '*',
        application,
        repository,
        identityProviders
      });

      const command = new Command({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      const res = await supertest(http.api).
        post('/v2/command').
        send(command);

      assert.that(res.statusCode).is.equalTo(401);
    });

    test('returns 401 if a command fails to authorize.', async () => {
      const directory = await commandFailsToAuthorize();

      application = await Application.load({ directory });
      repository = new Repository({ application, eventstore });

      http = new Http();

      await http.initialize({
        corsOrigin: '*',
        application,
        repository,
        identityProviders
      });

      const command = new Command({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      const res = await supertest(http.api).
        post('/v2/command').
        send(command);

      assert.that(res.statusCode).is.equalTo(401);
    });
  });

  suite('GET /v2/events', () => {
    let http;

    setup(async () => {
      http = new Http();

      await http.initialize({
        corsOrigin: '*',
        application,
        repository,
        identityProviders
      });
    });

    test('receives a single event from the event stream.', async () => {
      const executed = new Event({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: { causationId: uuid(), correlationId: uuid() }
      });

      process.nextTick(() => {
        http.eventStream.write({ event: executed, metadata: {}});
      });

      await new Promise((resolve, reject) => {
        try {
          supertest(http.api).get('/v2/events').pipe(asJsonStream(event => {
            assert.that(event.data).is.equalTo({ strategy: 'succeed' });
            resolve();
          }));
        } catch (ex) {
          reject(ex);
        }
      });
    });

    test('receives multiple events from the event stream.', async () => {
      const succeeded = new Event({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'succeeded',
        data: {},
        metadata: { causationId: uuid(), correlationId: uuid() }
      });
      const executed = new Event({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: { causationId: uuid(), correlationId: uuid() }
      });

      process.nextTick(() => {
        http.eventStream.write({ event: succeeded, metadata: {}});
        http.eventStream.write({ event: executed, metadata: {}});
      });

      await new Promise((resolve, reject) => {
        try {
          supertest(http.api).get('/v2/events').pipe(asJsonStream(
            event => {
              assert.that(event.name).is.equalTo('succeeded');
              assert.that(event.data).is.equalTo({});
            },
            event => {
              assert.that(event.name).is.equalTo('executed');
              assert.that(event.data).is.equalTo({ strategy: 'succeed' });
              resolve();
            }
          ));
        } catch (ex) {
          reject(ex);
        }
      });
    });

    test('receives filtered events from the event stream.', async () => {
      const succeeded = new Event({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'succeeded',
        data: {},
        metadata: { causationId: uuid(), correlationId: uuid() }
      });
      const executed = new Event({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: { causationId: uuid(), correlationId: uuid() }
      });

      process.nextTick(() => {
        http.eventStream.write({ event: succeeded, metadata: {}});
        http.eventStream.write({ event: executed, metadata: {}});
      });

      await new Promise((resolve, reject) => {
        try {
          supertest(http.api).
            get('/v2/events').
            query({ name: 'executed' }).
            pipe(asJsonStream(
              event => {
                assert.that(event.name).is.equalTo('executed');
                assert.that(event.data).is.equalTo({ strategy: 'succeed' });
                resolve();
              }
            ));
        } catch (ex) {
          reject(ex);
        }
      });
    });
  });
});

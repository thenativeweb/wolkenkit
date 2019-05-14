'use strict';

const path = require('path');

const assert = require('assertthat'),
      record = require('record-stdstreams'),
      supertest = require('supertest'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      asJsonStream = require('../../../shared/http/asJsonStream'),
      { Event } = require('../../../../common/elements'),
      eventFilter = require('../../../shared/applications/valid/eventFilter'),
      eventIsAuthorized = require('../../../shared/applications/valid/eventIsAuthorized'),
      eventMap = require('../../../shared/applications/valid/eventMap'),
      { Http } = require('../../../../apis/events'),
      identityProvider = require('../../../shared/identityProvider'),
      { InMemory } = require('../../../../stores/eventstore'),
      { Repository } = require('../../../../common/domain');

suite('events/Http', () => {
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

    test('serves the events configuration.', async () => {
      const res = await supertest(http.api).get('/v2/configuration');

      const events = application.events.external;

      // Convert and parse as JSON, to get rid of any values that are undefined.
      // This is what the HTTP API does internally, and here we need to simulate
      // this to make things work.
      const expectedConfiguration = JSON.parse(JSON.stringify(events));

      assert.that(res.body).is.equalTo(expectedConfiguration);
    });
  });

  suite('GET /v2/', () => {
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

    test('delivers a single event.', async () => {
      const executed = new Event({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: { causationId: uuid(), correlationId: uuid() }
      });

      executed.metadata.revision = 1;

      setTimeout(async () => {
        await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
      }, 50);

      await new Promise((resolve, reject) => {
        try {
          supertest(http.api).get('/v2/').pipe(asJsonStream(
            event => {
              assert.that(event).is.equalTo({ name: 'heartbeat' });
            },
            event => {
              assert.that(event.data).is.equalTo({ strategy: 'succeed' });
              resolve();
            }
          ));
        } catch (ex) {
          reject(ex);
        }
      });
    });

    test('delivers multiple events.', async () => {
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

      succeeded.metadata.revision = 1;
      executed.metadata.revision = 2;

      setTimeout(async () => {
        await http.sendEvent({ event: succeeded, metadata: { state: {}, previousState: {}}});
        await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
      }, 50);

      await new Promise((resolve, reject) => {
        try {
          supertest(http.api).get('/v2/').pipe(asJsonStream(
            event => {
              assert.that(event).is.equalTo({ name: 'heartbeat' });
            },
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

    test('delivers filtered events.', async () => {
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

      succeeded.metadata.revision = 1;
      executed.metadata.revision = 2;

      setTimeout(async () => {
        await http.sendEvent({ event: succeeded, metadata: { state: {}, previousState: {}}});
        await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
      }, 50);

      await new Promise((resolve, reject) => {
        try {
          supertest(http.api).
            get('/v2/').
            query({ name: 'executed' }).
            pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
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

    test('delivers filtered events with a nested filter.', async () => {
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

      succeeded.metadata.revision = 1;
      executed.metadata.revision = 2;

      setTimeout(async () => {
        await http.sendEvent({ event: succeeded, metadata: { state: {}, previousState: {}}});
        await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
      }, 50);

      await new Promise((resolve, reject) => {
        try {
          supertest(http.api).
            get('/v2/').
            query({
              context: { name: 'sampleContext' },
              name: 'executed'
            }).
            pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
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

    test('gracefully handles connections that get closed by the client.', async () => {
      const executed = new Event({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: { causationId: uuid(), correlationId: uuid() }
      });

      executed.metadata.revision = 1;

      try {
        await supertest(http.api).
          get('/v2/').
          timeout({ response: 10, deadline: 10 });
      } catch (ex) {
        if (ex.code !== 'ECONNABORTED') {
          throw ex;
        }

        // Ignore aborted connections, since that's what we want to achieve
        // here.
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      await assert.that(async () => {
        await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
      }).is.not.throwingAsync();
    });

    suite('isAuthorized', () => {
      test('skips an event if the event is not authorized.', async () => {
        const directory = await eventIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const authorizationDenied = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'authorizationDenied',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const executed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        authorizationDenied.metadata.revision = 1;
        executed.metadata.revision = 2;

        setTimeout(async () => {
          await http.sendEvent({ event: authorizationDenied, metadata: { state: {}, previousState: {}}});
          await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('executed');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('skips an event if an error is thrown.', async () => {
        const directory = await eventIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const authorizationFailed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'authorizationFailed',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const executed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        authorizationFailed.metadata.revision = 1;
        executed.metadata.revision = 2;

        setTimeout(async () => {
          await http.sendEvent({ event: authorizationFailed, metadata: { state: {}, previousState: {}}});
          await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('executed');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('does not mutate the event.', async () => {
        const directory = await eventIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const authorizedWithMutation = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'authorizedWithMutation',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        authorizedWithMutation.metadata.revision = 1;

        setTimeout(async () => {
          await http.sendEvent({ event: authorizedWithMutation, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('authorizedWithMutation');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });

        assert.that(authorizedWithMutation.data.isMutated).is.undefined();
      });

      test('uses the app service.', async () => {
        const directory = await eventIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid(),
              otherAggregateId = uuid();

        const otherSucceeded = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: otherAggregateId },
          name: 'succeeded',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const otherExecuted = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: otherAggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        otherSucceeded.metadata.revision = 1;
        otherExecuted.metadata.revision = 2;

        await eventstore.saveEvents({
          uncommittedEvents: [
            { event: otherSucceeded, state: {}},
            { event: otherExecuted, state: {}}
          ]
        });

        const useApp = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'useApp',
          data: { otherAggregateId },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        useApp.metadata.revision = 3;

        const stop = record();

        setTimeout(async () => {
          await http.sendEvent({ event: useApp, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('useApp');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });

        const { stdout } = stop();
        const message = JSON.parse(stdout);

        assert.that(message).is.equalTo({
          id: otherAggregateId,
          state: {}
        });
      });

      test('uses the client service.', async () => {
        const directory = await eventIsAuthorized();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const useClient = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'useClient',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        useClient.metadata.revision = 1;

        const stop = record();

        setTimeout(async () => {
          await http.sendEvent({ event: useClient, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('useClient');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });

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
          const directory = await eventIsAuthorized();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = new Http();

          await http.initialize({
            corsOrigin: '*',
            application,
            repository,
            identityProviders
          });

          const useLogger = new Event({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'useLogger',
            data: { logLevel },
            metadata: { causationId: uuid(), correlationId: uuid() }
          });

          const stop = record();

          setTimeout(async () => {
            await http.sendEvent({ event: useLogger, metadata: { state: {}, previousState: {}}});
          }, 50);

          await new Promise((resolve, reject) => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                event => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                event => {
                  assert.that(event.name).is.equalTo('useLogger');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });

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

    suite('filter', () => {
      test('skips an event if the event gets filtered out.', async () => {
        const directory = await eventFilter();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const filterDenied = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'filterDenied',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const executed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        filterDenied.metadata.revision = 1;
        executed.metadata.revision = 2;

        setTimeout(async () => {
          await http.sendEvent({ event: filterDenied, metadata: { state: {}, previousState: {}}});
          await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('executed');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('skips an event if an error is thrown.', async () => {
        const directory = await eventFilter();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const filterFailed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'filterFailed',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const executed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        filterFailed.metadata.revision = 1;
        executed.metadata.revision = 2;

        setTimeout(async () => {
          await http.sendEvent({ event: filterFailed, metadata: { state: {}, previousState: {}}});
          await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('executed');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('does not mutate the event.', async () => {
        const directory = await eventFilter();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const filteredWithMutation = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'filteredWithMutation',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        filteredWithMutation.metadata.revision = 1;

        setTimeout(async () => {
          await http.sendEvent({ event: filteredWithMutation, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('filteredWithMutation');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });

        assert.that(filteredWithMutation.data.isMutated).is.undefined();
      });

      test('uses the app service.', async () => {
        const directory = await eventFilter();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid(),
              otherAggregateId = uuid();

        const otherSucceeded = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: otherAggregateId },
          name: 'succeeded',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const otherExecuted = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: otherAggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        otherSucceeded.metadata.revision = 1;
        otherExecuted.metadata.revision = 2;

        await eventstore.saveEvents({
          uncommittedEvents: [
            { event: otherSucceeded, state: {}},
            { event: otherExecuted, state: {}}
          ]
        });

        const useApp = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'useApp',
          data: { otherAggregateId },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        useApp.metadata.revision = 3;

        const stop = record();

        setTimeout(async () => {
          await http.sendEvent({ event: useApp, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('useApp');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });

        const { stdout } = stop();
        const message = JSON.parse(stdout);

        assert.that(message).is.equalTo({
          id: otherAggregateId,
          state: {}
        });
      });

      test('uses the client service.', async () => {
        const directory = await eventFilter();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const useClient = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'useClient',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        useClient.metadata.revision = 1;

        const stop = record();

        setTimeout(async () => {
          await http.sendEvent({ event: useClient, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('useClient');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });

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
          const directory = await eventFilter();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = new Http();

          await http.initialize({
            corsOrigin: '*',
            application,
            repository,
            identityProviders
          });

          const useLogger = new Event({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'useLogger',
            data: { logLevel },
            metadata: { causationId: uuid(), correlationId: uuid() }
          });

          const stop = record();

          setTimeout(async () => {
            await http.sendEvent({ event: useLogger, metadata: { state: {}, previousState: {}}});
          }, 50);

          await new Promise((resolve, reject) => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                event => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                event => {
                  assert.that(event.name).is.equalTo('useLogger');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });

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

    suite('map', () => {
      test('maps the event.', async () => {
        const directory = await eventMap();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const mapApplied = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'mapApplied',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        mapApplied.metadata.revision = 1;

        setTimeout(async () => {
          await http.sendEvent({ event: mapApplied, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('mapApplied');
                assert.that(event.data).is.equalTo({ isMapped: true });
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('skips an event if the event gets filtered out.', async () => {
        const directory = await eventMap();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const mapDenied = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'mapDenied',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const executed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        mapDenied.metadata.revision = 1;
        executed.metadata.revision = 2;

        setTimeout(async () => {
          await http.sendEvent({ event: mapDenied, metadata: { state: {}, previousState: {}}});
          await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('executed');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('skips an event if an error is thrown.', async () => {
        const directory = await eventMap();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const mapFailed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'mapFailed',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const executed = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        mapFailed.metadata.revision = 1;
        executed.metadata.revision = 2;

        setTimeout(async () => {
          await http.sendEvent({ event: mapFailed, metadata: { state: {}, previousState: {}}});
          await http.sendEvent({ event: executed, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('executed');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('does not mutate the event.', async () => {
        const directory = await eventMap();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid();

        const mapAppliedWithMutation = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'mapAppliedWithMutation',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        mapAppliedWithMutation.metadata.revision = 1;

        setTimeout(async () => {
          await http.sendEvent({ event: mapAppliedWithMutation, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('mapAppliedWithMutation');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });

        assert.that(mapAppliedWithMutation.data.isMutated).is.undefined();
      });

      test('uses the app service.', async () => {
        const directory = await eventMap();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const aggregateId = uuid(),
              otherAggregateId = uuid();

        const otherSucceeded = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: otherAggregateId },
          name: 'succeeded',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });
        const otherExecuted = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: otherAggregateId },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        otherSucceeded.metadata.revision = 1;
        otherExecuted.metadata.revision = 2;

        await eventstore.saveEvents({
          uncommittedEvents: [
            { event: otherSucceeded, state: {}},
            { event: otherExecuted, state: {}}
          ]
        });

        const useApp = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId },
          name: 'useApp',
          data: { otherAggregateId },
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        useApp.metadata.revision = 3;

        const stop = record();

        setTimeout(async () => {
          await http.sendEvent({ event: useApp, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('useApp');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });

        const { stdout } = stop();
        const message = JSON.parse(stdout);

        assert.that(message).is.equalTo({
          id: otherAggregateId,
          state: {}
        });
      });

      test('uses the client service.', async () => {
        const directory = await eventMap();

        application = await Application.load({ directory });
        repository = new Repository({ application, eventstore });

        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          application,
          repository,
          identityProviders
        });

        const useClient = new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'useClient',
          metadata: { causationId: uuid(), correlationId: uuid() }
        });

        useClient.metadata.revision = 1;

        const stop = record();

        setTimeout(async () => {
          await http.sendEvent({ event: useClient, metadata: { state: {}, previousState: {}}});
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.name).is.equalTo('useClient');
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });

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
          const directory = await eventMap();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = new Http();

          await http.initialize({
            corsOrigin: '*',
            application,
            repository,
            identityProviders
          });

          const useLogger = new Event({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'useLogger',
            data: { logLevel },
            metadata: { causationId: uuid(), correlationId: uuid() }
          });

          const stop = record();

          setTimeout(async () => {
            await http.sendEvent({ event: useLogger, metadata: { state: {}, previousState: {}}});
          }, 50);

          await new Promise((resolve, reject) => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                event => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                event => {
                  assert.that(event.name).is.equalTo('useLogger');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });

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

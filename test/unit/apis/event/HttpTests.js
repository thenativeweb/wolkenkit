'use strict';

const path = require('path');

const assert = require('assertthat'),
      record = require('record-stdstreams'),
      supertest = require('supertest'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      asJsonStream = require('../../../shared/http/asJsonStream'),
      { EventExternal, EventInternal } = require('../../../../common/elements'),
      eventFilter = require('../../../shared/applications/valid/eventFilter'),
      eventIsAuthorized = require('../../../shared/applications/valid/eventIsAuthorized'),
      eventMap = require('../../../shared/applications/valid/eventMap'),
      { Http } = require('../../../../apis/event'),
      identityProvider = require('../../../shared/identityProvider'),
      { InMemory } = require('../../../../stores/eventstore'),
      { Repository } = require('../../../../common/domain'),
      sleep = require('../../../../common/utils/sleep');

suite('event/Http', () => {
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
          purpose: 'external',
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
          purpose: 'external',
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
          purpose: 'external',
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
          purpose: 'external',
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
        purpose: 'external',
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
        const http = new Http();

        await http.initialize({
          corsOrigin: corsOrigin.allow,
          purpose: 'external',
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

  suite('external', () => {
    suite('GET /v2/configuration', () => {
      let http;

      setup(async () => {
        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          purpose: 'external',
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

      test('serves the event configuration.', async () => {
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
          purpose: 'external',
          application,
          repository,
          identityProviders
        });
      });

      test('throws an error on external events.', async () => {
        const executed = EventExternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        await assert.that(async () => {
          await http.sendEvent({ event: executed });
        }).is.throwingAsync('Event must be internal.');
      });

      test('delivers a single event.', async () => {
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async () => {
          await http.sendEvent({ event: executed });
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
        const succeeded = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async () => {
          await http.sendEvent({ event: succeeded });
          await http.sendEvent({ event: executed });
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
        const succeeded = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async () => {
          await http.sendEvent({ event: succeeded });
          await http.sendEvent({ event: executed });
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
        const succeeded = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async () => {
          await http.sendEvent({ event: succeeded });
          await http.sendEvent({ event: executed });
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

      test('removes annotations before delivery.', async () => {
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async () => {
          await http.sendEvent({ event: executed });
        }, 50);

        await new Promise((resolve, reject) => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              event => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              event => {
                assert.that(event.annotations).is.undefined();
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('gracefully handles connections that get closed by the client.', async () => {
        const executed = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

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

        await sleep({ ms: 50 });

        await assert.that(async () => {
          await http.sendEvent({ event: executed });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const authorizationDenied = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'authorizationDenied',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: authorizationDenied });
            await http.sendEvent({ event: executed });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const authorizationFailed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'authorizationFailed',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: authorizationFailed });
            await http.sendEvent({ event: executed });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const authorizedWithMutation = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'authorizedWithMutation',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: authorizedWithMutation });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid(),
                otherAggregateId = uuid();

          const otherSucceeded = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: otherAggregateId },
            name: 'succeeded',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const otherExecuted = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: otherAggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          await eventstore.saveEvents({
            uncommittedEvents: [ otherSucceeded, otherExecuted ]
          });

          const useApp = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'useApp',
            data: { otherAggregateId },
            metadata: {
              revision: { aggregate: 3 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async () => {
            await http.sendEvent({ event: useApp });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const useClient = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'useClient',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async () => {
            await http.sendEvent({ event: useClient });
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
              claims: {
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
              purpose: 'external',
              application,
              repository,
              identityProviders
            });

            const useLogger = EventInternal.create({
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: uuid() },
              name: 'useLogger',
              data: { logLevel },
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              },
              annotations: { state: {}, previousState: {}}
            });

            const stop = record();

            setTimeout(async () => {
              await http.sendEvent({ event: useLogger });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const filterDenied = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'filterDenied',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: filterDenied });
            await http.sendEvent({ event: executed });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const filterFailed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'filterFailed',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: filterFailed });
            await http.sendEvent({ event: executed });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const filteredWithMutation = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'filteredWithMutation',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: filteredWithMutation });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid(),
                otherAggregateId = uuid();

          const otherSucceeded = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: otherAggregateId },
            name: 'succeeded',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const otherExecuted = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: otherAggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          await eventstore.saveEvents({
            uncommittedEvents: [ otherSucceeded, otherExecuted ]
          });

          const useApp = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'useApp',
            data: { otherAggregateId },
            metadata: {
              revision: { aggregate: 3 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async () => {
            await http.sendEvent({ event: useApp });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const useClient = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'useClient',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async () => {
            await http.sendEvent({ event: useClient });
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
              claims: {
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
              purpose: 'external',
              application,
              repository,
              identityProviders
            });

            const useLogger = EventInternal.create({
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: uuid() },
              name: 'useLogger',
              data: { logLevel },
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              },
              annotations: { state: {}, previousState: {}}
            });

            const stop = record();

            setTimeout(async () => {
              await http.sendEvent({ event: useLogger });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const mapApplied = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'mapApplied',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: mapApplied });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const mapDenied = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'mapDenied',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: mapDenied });
            await http.sendEvent({ event: executed });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const mapFailed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'mapFailed',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: mapFailed });
            await http.sendEvent({ event: executed });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const mapAppliedWithMutation = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'mapAppliedWithMutation',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async () => {
            await http.sendEvent({ event: mapAppliedWithMutation });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid(),
                otherAggregateId = uuid();

          const otherSucceeded = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: otherAggregateId },
            name: 'succeeded',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const otherExecuted = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: otherAggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          await eventstore.saveEvents({
            uncommittedEvents: [ otherSucceeded, otherExecuted ]
          });

          const useApp = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: aggregateId },
            name: 'useApp',
            data: { otherAggregateId },
            metadata: {
              revision: { aggregate: 3 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async () => {
            await http.sendEvent({ event: useApp });
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
            purpose: 'external',
            application,
            repository,
            identityProviders
          });

          const useClient = EventInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
            name: 'useClient',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async () => {
            await http.sendEvent({ event: useClient });
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
              claims: {
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
              purpose: 'external',
              application,
              repository,
              identityProviders
            });

            const useLogger = EventInternal.create({
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: uuid() },
              name: 'useLogger',
              data: { logLevel },
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              },
              annotations: { state: {}, previousState: {}}
            });

            const stop = record();

            setTimeout(async () => {
              await http.sendEvent({ event: useLogger });
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

    suite('POST /v2/', () => {
      let http;

      setup(async () => {
        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          purpose: 'external',
          application,
          repository,
          identityProviders
        });
      });

      test('returns a 404.', async () => {
        const { status } = await supertest(http.api).post('/v2/');

        assert.that(status).is.equalTo(404);
      });
    });
  });

  suite('internal', () => {
    suite('GET /v2/configuration', () => {
      let http;

      setup(async () => {
        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          onReceiveEvent () {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });
      });

      test('returns 404.', async () => {
        const { status } = await supertest(http.api).get('/v2/configuration');

        assert.that(status).is.equalTo(404);
      });
    });

    suite('GET /v2/', () => {
      let http;

      setup(async () => {
        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          onReceiveEvent () {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });
      });

      test('returns 404.', async () => {
        const { status } = await supertest(http.api).get('/v2/');

        assert.that(status).is.equalTo(404);
      });
    });

    suite('POST /v2/', () => {
      let http,
          receivedEvents;

      setup(async () => {
        receivedEvents = [];
        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          onReceiveEvent ({ event }) {
            receivedEvents.push(event);
          },
          application,
          repository,
          identityProviders
        });
      });

      test('returns 415 if the content-type header is missing.', async () => {
        const { status, text } = await supertest(http.api).post('/v2/');

        assert.that(status).is.equalTo(415);
        assert.that(text).is.equalTo('Header content-type must be application/json.');
      });

      test('returns 415 if content-type is not set to application/json.', async () => {
        const { status, text } = await supertest(http.api).
          post('/v2/').
          set({
            'content-type': 'text/plain'
          }).
          send('foobar');

        assert.that(status).is.equalTo(415);
        assert.that(text).is.equalTo('Header content-type must be application/json.');
      });

      test('returns 400 if a malformed event is sent.', async () => {
        const { status, text } = await supertest(http.api).
          post('/v2/').
          send({ foo: 'bar' });

        assert.that(status).is.equalTo(400);
        assert.that(text).is.equalTo('Malformed event.');
      });

      test('returns 400 if a wellformed event is sent with a non-existent context name.', async () => {
        const event = EventInternal.create({
          context: { name: 'nonExistent' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const { status, text } = await supertest(http.api).
          post('/v2/').
          send(event);

        assert.that(status).is.equalTo(400);
        assert.that(text).is.equalTo('Invalid context name.');
      });

      test('returns 400 if a wellformed event is sent with a non-existent aggregate name.', async () => {
        const event = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'nonExistent', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const { status, text } = await supertest(http.api).
          post('/v2/').
          send(event);

        assert.that(status).is.equalTo(400);
        assert.that(text).is.equalTo('Invalid aggregate name.');
      });

      test('returns 400 if a wellformed event is sent with a non-existent event name.', async () => {
        const event = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const { status, text } = await supertest(http.api).
          post('/v2/').
          send(event);

        assert.that(status).is.equalTo(400);
        assert.that(text).is.equalTo('Invalid event name.');
      });

      test('returns 400 if an event is sent with a payload that does not match the schema.', async () => {
        const event = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'invalid-value' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const { status, text } = await supertest(http.api).
          post('/v2/').
          send(event);

        assert.that(status).is.equalTo(400);
        assert.that(text).is.equalTo('No enum match (invalid-value), expects: succeed, fail, reject (at event.data.strategy).');
      });

      test('returns 200 if a wellformed and existing event is sent.', async () => {
        const event = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const { status } = await supertest(http.api).
          post('/v2/').
          send(event);

        assert.that(status).is.equalTo(200);
      });

      test('receives events.', async () => {
        const event = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await supertest(http.api).
          post('/v2/').
          send(event);

        assert.that(receivedEvents.length).is.equalTo(1);
        assert.that(receivedEvents[0]).is.equalTo(event);
      });

      test('returns 500 if on received event throws an error.', async () => {
        http = new Http();

        await http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          async onReceiveEvent () {
            throw new Error('Failed to handle received event.');
          },
          application,
          repository,
          identityProviders
        });

        const event = EventInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        const { status } = await supertest(http.api).
          post('/v2/').
          send(event);

        assert.that(status).is.equalTo(500);
      });
    });
  });
});

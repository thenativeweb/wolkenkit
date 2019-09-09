import Application from '../../../../src/common/application';
import asJsonStream from '../../../shared/http/asJsonStream';
import assert from 'assertthat';
import eventFilter from '../../../shared/applications/valid/eventFilter';
import EventInternal from '../../../../src/common/elements/EventInternal';
import eventIsAuthorized from '../../../shared/applications/valid/eventIsAuthorized';
import eventMap from '../../../shared/applications/valid/eventMap';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import Http from '../../../../src/apis/event/Http';
import identityProvider from '../../../shared/identityProvider';
import InMemoryEventstore from '../../../../src/stores/eventstore/InMemory/InMemoryEventStore';
import path from 'path';
import record from 'record-stdstreams';
import Repository from '../../../../src/common/domain/Repository';
import sleep from '../../../../src/common/utils/sleep';
import uuid from 'uuidv4';
import supertest, { Response } from 'supertest';

suite('event/Http', (): void => {
  const identityProviders = [ identityProvider ];
  let application: Application,
      eventstore: Eventstore,
      repository: Repository;

  setup(async (): Promise<void> => {
    const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

    eventstore = new InMemoryEventstore();
    await eventstore.initialize();

    application = await Application.load({ directory });
    repository = new Repository({ application, eventstore });
  });

  teardown(async (): Promise<void> => {
    await eventstore.destroy();
  });

  test('is a function.', async (): Promise<void> => {
    assert.that(Http).is.ofType('function');
  });

  suite('initialize', (): void => {
    test('sets api to an Express application.', async (): Promise<void> => {
      const http = await Http.initialize({
        corsOrigin: '*',
        purpose: 'external',
        async onReceiveEvent (): Promise<void> {
          // Intentionally left blank.
        },
        application,
        repository,
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
        const http = await Http.initialize({
          corsOrigin: corsOrigin.allow,
          purpose: 'external',
          async onReceiveEvent (): Promise<void> {
            // Intentionally left blank.
          },
          application,
          repository,
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

  suite('external', (): void => {
    suite('GET /v2/configuration', (): void => {
      let http: Http;

      setup(async (): Promise<void> => {
        http = await Http.initialize({
          corsOrigin: '*',
          purpose: 'external',
          async onReceiveEvent (): Promise<void> {
            // Intentionally left blank.
          },
          application,
          repository,
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

      test('serves the event configuration.', async (): Promise<void> => {
        await supertest(http.api).
          get('/v2/configuration').
          expect((res: Response): void => {
            const events = application.events.external;

            // Convert and parse as JSON, to get rid of any values that are undefined.
            // This is what the HTTP API does internally, and here we need to simulate
            // this to make things work.
            const expectedConfiguration = JSON.parse(JSON.stringify(events));

            assert.that(res.body).is.equalTo(expectedConfiguration);
          });
      });
    });

    suite('GET /v2/', (): void => {
      let http: Http;

      setup(async (): Promise<void> => {
        http = await Http.initialize({
          corsOrigin: '*',
          purpose: 'external',
          async onReceiveEvent (): Promise<void> {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });
      });

      test('delivers a single event.', async (): Promise<void> => {
        const executed = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async (): Promise<void> => {
          await http.sendEvent({ event: executed });
        }, 50);

        await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              (event: EventInternal): void => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              (event: EventInternal): void => {
                assert.that(event.data).is.equalTo({ strategy: 'succeed' });
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('delivers multiple events.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });
        const executed = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async (): Promise<void> => {
          await http.sendEvent({ event: succeeded });
          await http.sendEvent({ event: executed });
        }, 50);

        await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              (event: EventInternal): void => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              (event: EventInternal): void => {
                assert.that(event.name).is.equalTo('succeeded');
                assert.that(event.data).is.equalTo({});
              },
              (event: EventInternal): void => {
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

      test('delivers filtered events.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });
        const executed = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async (): Promise<void> => {
          await http.sendEvent({ event: succeeded });
          await http.sendEvent({ event: executed });
        }, 50);

        await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
          try {
            supertest(http.api).
              get('/v2/').
              query({ name: 'executed' }).
              pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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

      test('delivers filtered events with a nested filter.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });
        const executed = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 2 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async (): Promise<void> => {
          await http.sendEvent({ event: succeeded });
          await http.sendEvent({ event: executed });
        }, 50);

        await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
          try {
            supertest(http.api).
              get('/v2/').
              query({
                contextIdentifier: { name: 'sampleContext' },
                name: 'executed'
              }).
              pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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

      test('removes annotations before delivery.', async (): Promise<void> => {
        const executed = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        setTimeout(async (): Promise<void> => {
          await http.sendEvent({ event: executed });
        }, 50);

        await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
          try {
            supertest(http.api).get('/v2/').pipe(asJsonStream(
              (event: EventInternal): void => {
                assert.that(event).is.equalTo({ name: 'heartbeat' });
              },
              (event: EventInternal): void => {
                assert.that(event.annotations).is.undefined();
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('gracefully handles connections that get closed by the client.', async (): Promise<void> => {
        const executed = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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

        await assert.that(async (): Promise<void> => {
          await http.sendEvent({ event: executed });
        }).is.not.throwingAsync();
      });

      suite('isAuthorized', (): void => {
        test('skips an event if the event is not authorized.', async (): Promise<void> => {
          const directory = await eventIsAuthorized();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const authorizationDenied = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'authorizationDenied',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: authorizationDenied });
            await http.sendEvent({ event: executed });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
                  assert.that(event.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('skips an event if an error is thrown.', async (): Promise<void> => {
          const directory = await eventIsAuthorized();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const authorizationFailed = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'authorizationFailed',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: authorizationFailed });
            await http.sendEvent({ event: executed });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
                  assert.that(event.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('does not mutate the event.', async (): Promise<void> => {
          const directory = await eventIsAuthorized();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const authorizedWithMutation = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'authorizedWithMutation',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: authorizedWithMutation });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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

        test('uses the app service.', async (): Promise<void> => {
          const directory = await eventIsAuthorized();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });
          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid(),
                otherAggregateId = uuid();

          const otherSucceeded = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: otherAggregateId },
            name: 'succeeded',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const otherExecuted = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: otherAggregateId },
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
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'useApp',
            data: { otherAggregateId },
            metadata: {
              revision: { aggregate: 3 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: useApp });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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

          assert.that(message).is.atLeast({
            id: otherAggregateId,
            state: {}
          });
        });

        test('uses the client service.', async (): Promise<void> => {
          const directory = await eventIsAuthorized();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const useClient = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'useClient',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: useClient });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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
          test(`uses the logger service with log level '${logLevel}'.`, async (): Promise<void> => {
            const directory = await eventIsAuthorized();

            application = await Application.load({ directory });
            repository = new Repository({ application, eventstore });

            http = await Http.initialize({
              corsOrigin: '*',
              purpose: 'external',
              async onReceiveEvent (): Promise<void> {
                // Intentionally left blank.
              },
              application,
              repository,
              identityProviders
            });

            const useLogger = EventInternal.create({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
              name: 'useLogger',
              data: { logLevel },
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              },
              annotations: { state: {}, previousState: {}}
            });

            const stop = record();

            setTimeout(async (): Promise<void> => {
              await http.sendEvent({ event: useLogger });
            }, 50);

            await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
              try {
                supertest(http.api).get('/v2/').pipe(asJsonStream(
                  (event: EventInternal): void => {
                    assert.that(event).is.equalTo({ name: 'heartbeat' });
                  },
                  (event: EventInternal): void => {
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
              message: 'Some log message.'
            });
          });
          /* eslint-enable no-loop-func */
        }
      });

      suite('filter', (): void => {
        test('skips an event if the event gets filtered out.', async (): Promise<void> => {
          const directory = await eventFilter();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const filterDenied = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'filterDenied',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: filterDenied });
            await http.sendEvent({ event: executed });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
                  assert.that(event.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('skips an event if an error is thrown.', async (): Promise<void> => {
          const directory = await eventFilter();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const filterFailed = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'filterFailed',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: filterFailed });
            await http.sendEvent({ event: executed });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
                  assert.that(event.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('does not mutate the event.', async (): Promise<void> => {
          const directory = await eventFilter();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const filteredWithMutation = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'filteredWithMutation',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: filteredWithMutation });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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

        test('uses the app service.', async (): Promise<void> => {
          const directory = await eventFilter();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid(),
                otherAggregateId = uuid();

          const otherSucceeded = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: otherAggregateId },
            name: 'succeeded',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const otherExecuted = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: otherAggregateId },
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
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'useApp',
            data: { otherAggregateId },
            metadata: {
              revision: { aggregate: 3 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: useApp });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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

          assert.that(message).is.atLeast({
            id: otherAggregateId,
            state: {}
          });
        });

        test('uses the client service.', async (): Promise<void> => {
          const directory = await eventFilter();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const useClient = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'useClient',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: useClient });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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
          test(`uses the logger service with log level '${logLevel}'.`, async (): Promise<void> => {
            const directory = await eventFilter();

            application = await Application.load({ directory });
            repository = new Repository({ application, eventstore });

            http = await Http.initialize({
              corsOrigin: '*',
              purpose: 'external',
              async onReceiveEvent (): Promise<void> {
                // Intentionally left blank.
              },
              application,
              repository,
              identityProviders
            });

            const useLogger = EventInternal.create({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
              name: 'useLogger',
              data: { logLevel },
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              },
              annotations: { state: {}, previousState: {}}
            });

            const stop = record();

            setTimeout(async (): Promise<void> => {
              await http.sendEvent({ event: useLogger });
            }, 50);

            await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
              try {
                supertest(http.api).get('/v2/').pipe(asJsonStream(
                  (event: EventInternal): void => {
                    assert.that(event).is.equalTo({ name: 'heartbeat' });
                  },
                  (event: EventInternal): void => {
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
              message: 'Some log message.'
            });
          });
          /* eslint-enable no-loop-func */
        }
      });

      suite('map', (): void => {
        test('maps the event.', async (): Promise<void> => {
          const directory = await eventMap();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const mapApplied = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'mapApplied',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: mapApplied });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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

        test('skips an event if the event gets filtered out.', async (): Promise<void> => {
          const directory = await eventMap();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const mapDenied = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'mapDenied',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: mapDenied });
            await http.sendEvent({ event: executed });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
                  assert.that(event.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('skips an event if an error is thrown.', async (): Promise<void> => {
          const directory = await eventMap();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const mapFailed = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'mapFailed',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const executed = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: mapFailed });
            await http.sendEvent({ event: executed });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
                  assert.that(event.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('does not mutate the event.', async (): Promise<void> => {
          const directory = await eventMap();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid();

          const mapAppliedWithMutation = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'mapAppliedWithMutation',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: mapAppliedWithMutation });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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

        test('uses the app service.', async (): Promise<void> => {
          const directory = await eventMap();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const aggregateId = uuid(),
                otherAggregateId = uuid();

          const otherSucceeded = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: otherAggregateId },
            name: 'succeeded',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });
          const otherExecuted = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: otherAggregateId },
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
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            name: 'useApp',
            data: { otherAggregateId },
            metadata: {
              revision: { aggregate: 3 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: useApp });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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

          assert.that(message).is.atLeast({
            id: otherAggregateId,
            state: {}
          });
        });

        test('uses the client service.', async (): Promise<void> => {
          const directory = await eventMap();

          application = await Application.load({ directory });
          repository = new Repository({ application, eventstore });

          http = await Http.initialize({
            corsOrigin: '*',
            purpose: 'external',
            async onReceiveEvent (): Promise<void> {
              // Intentionally left blank.
            },
            application,
            repository,
            identityProviders
          });

          const useClient = EventInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'useClient',
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            },
            annotations: { state: {}, previousState: {}}
          });

          const stop = record();

          setTimeout(async (): Promise<void> => {
            await http.sendEvent({ event: useClient });
          }, 50);

          await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
            try {
              supertest(http.api).get('/v2/').pipe(asJsonStream(
                (event: EventInternal): void => {
                  assert.that(event).is.equalTo({ name: 'heartbeat' });
                },
                (event: EventInternal): void => {
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
          test(`uses the logger service with log level '${logLevel}'.`, async (): Promise<void> => {
            const directory = await eventMap();

            application = await Application.load({ directory });
            repository = new Repository({ application, eventstore });

            http = await Http.initialize({
              corsOrigin: '*',
              purpose: 'external',
              async onReceiveEvent (): Promise<void> {
                // Intentionally left blank.
              },
              application,
              repository,
              identityProviders
            });

            const useLogger = EventInternal.create({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
              name: 'useLogger',
              data: { logLevel },
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              },
              annotations: { state: {}, previousState: {}}
            });

            const stop = record();

            setTimeout(async (): Promise<void> => {
              await http.sendEvent({ event: useLogger });
            }, 50);

            await new Promise((resolve: (value?: unknown) => void, reject: (reason?: any) => void): void => {
              try {
                supertest(http.api).get('/v2/').pipe(asJsonStream(
                  (event: EventInternal): void => {
                    assert.that(event).is.equalTo({ name: 'heartbeat' });
                  },
                  (event: EventInternal): void => {
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
              message: 'Some log message.'
            });
          });
          /* eslint-enable no-loop-func */
        }
      });
    });

    suite('POST /v2/', (): void => {
      let http: Http;

      setup(async (): Promise<void> => {
        http = await Http.initialize({
          corsOrigin: '*',
          purpose: 'external',
          async onReceiveEvent (): Promise<void> {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });
      });

      test('returns a 404.', async (): Promise<void> => {
        const { status } = await supertest(http.api).post('/v2/');

        assert.that(status).is.equalTo(404);
      });
    });
  });

  suite('internal', (): void => {
    suite('GET /v2/configuration', (): void => {
      let http: Http;

      setup(async (): Promise<void> => {
        http = await Http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          onReceiveEvent (): void {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });
      });

      test('returns 404.', async (): Promise<void> => {
        await supertest(http.api).
          get('/v2/configuration').
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(404);
          });
      });
    });

    suite('GET /v2/', (): void => {
      let http: Http;

      setup(async (): Promise<void> => {
        http = await Http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          onReceiveEvent (): void {
            // Intentionally left blank.
          },
          application,
          repository,
          identityProviders
        });
      });

      test('returns 404.', async (): Promise<void> => {
        await supertest(http.api).
          get('/v2/').
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(404);
          });
      });
    });

    suite('POST /v2/', (): void => {
      let http: Http,
          receivedEvents: EventInternal[];

      setup(async (): Promise<void> => {
        receivedEvents = [];
        http = await Http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          onReceiveEvent ({ event }: {
            event: EventInternal;
          }): void {
            receivedEvents.push(event);
          },
          application,
          repository,
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

      test('returns 400 if a malformed event is sent.', async (): Promise<void> => {
        await supertest(http.api).
          post('/v2/').
          send({ foo: 'bar' }).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Event malformed.');
          });
      });

      test('returns 400 if a wellformed event is sent with a non-existent context name.', async (): Promise<void> => {
        const event = EventInternal.create({
          contextIdentifier: { name: 'nonExistent' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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
          send(event).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid context name.');
          });
      });

      test('returns 400 if a wellformed event is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const event = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'nonExistent', id: uuid() },
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
          send(event).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid aggregate name.');
          });
      });

      test('returns 400 if a wellformed event is sent with a non-existent event name.', async (): Promise<void> => {
        const event = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await supertest(http.api).
          post('/v2/').
          send(event).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('Invalid event name.');
          });
      });

      test('returns 400 if an event is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const event = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'invalid-value' },
          metadata: {
            revision: { aggregate: 1 },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          },
          annotations: { state: {}, previousState: {}}
        });

        await supertest(http.api).
          post('/v2/').
          send(event).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(400);
            assert.that(res.text).is.equalTo('No enum match (invalid-value), expects: succeed, fail, reject (at event.data.strategy).');
          });
      });

      test('returns 200 if a wellformed and existing event is sent.', async (): Promise<void> => {
        const event = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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
          send(event).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
          });
      });

      test('receives events.', async (): Promise<void> => {
        const event = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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

      test('returns 500 if on received event throws an error.', async (): Promise<void> => {
        http = await Http.initialize({
          corsOrigin: '*',
          purpose: 'internal',
          async onReceiveEvent (): Promise<void> {
            throw new Error('Failed to handle received event.');
          },
          application,
          repository,
          identityProviders
        });

        const event = EventInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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
          send(event).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(500);
          });
      });
    });
  });
});

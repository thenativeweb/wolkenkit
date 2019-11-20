import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { getApi } from '../../../../lib/apis/observeDomainEvents/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory/InMemoryDomainEventStore';
import { PublishDomainEvent } from '../../../../lib/apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../lib/common/domain/Repository';
import { sleep } from '../../../../lib/common/utils/sleep';
import { State } from '../../../../lib/common/elements/State';
import { uuid } from 'uuidv4';
import supertest, { Response } from 'supertest';

suite('observeDomainEvents/http', (): void => {
  const identityProviders = [ identityProvider ];

  let applicationDefinition: ApplicationDefinition,
      domainEventStore: DomainEventStore,
      repository: Repository;

  setup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
    domainEventStore = await InMemoryDomainEventStore.create();
    repository = new Repository({ applicationDefinition, domainEventStore });
  });

  teardown(async (): Promise<void> => {
    await domainEventStore.destroy();
  });

  suite('/v2', (): void => {
    suite('GET /description', (): void => {
      let api: Application;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          applicationDefinition,
          repository,
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

      test('returns the domain events description.', async (): Promise<void> => {
        await supertest(api).
          get('/v2/description').
          expect((res: Response): void => {
            const { domainEvents: domainEventsDescription } = getApplicationDescription({
              applicationDefinition
            });

            // Convert and parse as JSON, to get rid of any values that are undefined.
            // This is what the HTTP API does internally, and here we need to simulate
            // this to make things work.
            const expectedDomainEventsDescription =
              JSON.parse(JSON.stringify(domainEventsDescription));

            assert.that(res.body).is.equalTo(expectedDomainEventsDescription);
          });
      });
    });

    suite('GET /', (): void => {
      let api: Application,
          publishDomainEvent: PublishDomainEvent;

      setup(async (): Promise<void> => {
        ({ api, publishDomainEvent } = await getApi({
          corsOrigin: '*',
          applicationDefinition,
          repository,
          identityProviders
        }));
      });

      test('delivers a single domain event.', async (): Promise<void> => {
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: executed });
        }, 50);

        await new Promise((resolve, reject): void => {
          try {
            supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
              },
              (domainEvent): void => {
                assert.that(domainEvent.data).is.equalTo({ strategy: 'succeed' });
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('delivers multiple domain events.', async (): Promise<void> => {
        const succeeded = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'succeeded',
            data: {},
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: succeeded });
          publishDomainEvent({ domainEvent: executed });
        }, 50);

        await new Promise((resolve, reject): void => {
          try {
            supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
              },
              (domainEvent): void => {
                assert.that(domainEvent.name).is.equalTo('succeeded');
                assert.that(domainEvent.data).is.equalTo({});
              },
              (domainEvent): void => {
                assert.that(domainEvent.name).is.equalTo('executed');
                assert.that(domainEvent.data).is.equalTo({ strategy: 'succeed' });
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('delivers filtered domain events.', async (): Promise<void> => {
        const succeeded = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'succeeded',
            data: {},
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: succeeded });
          publishDomainEvent({ domainEvent: executed });
        }, 50);

        await new Promise((resolve, reject): void => {
          try {
            supertest(api).
              get('/v2/').
              query({ name: 'executed' }).
              pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('executed');
                  assert.that(domainEvent.data).is.equalTo({ strategy: 'succeed' });
                  resolve();
                }
              ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('delivers filtered domain events with a nested filter.', async (): Promise<void> => {
        const succeeded = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'succeeded',
            data: {},
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 2 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: succeeded });
          publishDomainEvent({ domainEvent: executed });
        }, 50);

        await new Promise((resolve, reject): void => {
          try {
            supertest(api).
              get('/v2/').
              query({
                contextIdentifier: { name: 'sampleContext' },
                name: 'executed'
              }).
              pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('executed');
                  assert.that(domainEvent.data).is.equalTo({ strategy: 'succeed' });
                  resolve();
                }
              ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('removes state before delivery.', async (): Promise<void> => {
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        setTimeout(async (): Promise<void> => {
          publishDomainEvent({ domainEvent: executed });
        }, 50);

        await new Promise((resolve, reject): void => {
          try {
            supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
              (domainEvent): void => {
                assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
              },
              (domainEvent): void => {
                assert.that((domainEvent as DomainEventWithState<State, DomainEventData>).state).is.undefined();
                resolve();
              }
            ));
          } catch (ex) {
            reject(ex);
          }
        });
      });

      test('gracefully handles connections that get closed by the client.', async (): Promise<void> => {
        const executed = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
              revision: { aggregate: 1 },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          state: { previous: {}, next: {}}
        });

        try {
          await supertest(api).
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
          publishDomainEvent({ domainEvent: executed });
        }).is.not.throwingAsync();
      });

      suite('isAuthorized', (): void => {
        test('skips a domain event if the domain event is not authorized.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({
            name: 'withDomainEventAuthorization'
          });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const authorizationDenied = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'authorizationDenied',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });
          const executed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'executed',
              data: { strategy: 'succeed' },
              metadata: {
                revision: { aggregate: 2 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: authorizationDenied });
            publishDomainEvent({ domainEvent: executed });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('skips a domain event if an error is thrown.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({
            name: 'withDomainEventAuthorization'
          });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const authorizationFailed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'authorizationFailed',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });
          const executed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'executed',
              data: { strategy: 'succeed' },
              metadata: {
                revision: { aggregate: 2 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: authorizationFailed });
            publishDomainEvent({ domainEvent: executed });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('does not mutate the domain event.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({ name: 'withDomainEventAuthorization' });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const authorizationWithMutation = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'authorizationWithMutation',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: authorizationWithMutation });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('authorizationWithMutation');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });

          assert.that((authorizationWithMutation.data as any).isMutated).is.undefined();
        });
      });

      suite('filter', (): void => {
        test('does not skip a domain event if the domain event does not get filtered out.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({ name: 'withDomainEventFilter' });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const filterPassed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'filterPassed',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: filterPassed });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('filterPassed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('skips a domain event if the domain event gets filtered out.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({ name: 'withDomainEventFilter' });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const filterDenied = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'filterDenied',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });
          const executed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'executed',
              data: { strategy: 'succeed' },
              metadata: {
                revision: { aggregate: 2 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: filterDenied });
            publishDomainEvent({ domainEvent: executed });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('skips a domain event if an error is thrown.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({ name: 'withDomainEventFilter' });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const filterFailed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'filterFailed',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });
          const executed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'executed',
              data: { strategy: 'succeed' },
              metadata: {
                revision: { aggregate: 2 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: filterFailed });
            publishDomainEvent({ domainEvent: executed });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('does not mutate the domain event.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({ name: 'withDomainEventFilter' });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const filterWithMutation = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'filterWithMutation',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: filterWithMutation });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('filterWithMutation');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });

          assert.that((filterWithMutation.data as any).isMutated).is.undefined();
        });
      });

      suite('map', (): void => {
        test('maps the domain event.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({ name: 'withDomainEventMap' });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const mapApplied = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'mapApplied',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: mapApplied });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('mapApplied');
                  assert.that(domainEvent.data).is.equalTo({ isMapped: true });
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('skips a domain event if the domain event gets mapped to undefined.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({ name: 'withDomainEventMap' });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const mapToUndefined = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'mapToUndefined',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });
          const executed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'executed',
              data: { strategy: 'succeed' },
              metadata: {
                revision: { aggregate: 2 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: mapToUndefined });
            publishDomainEvent({ domainEvent: executed });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('skips a domain event if an error is thrown.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({ name: 'withDomainEventMap' });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const mapFailed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'mapFailed',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });
          const executed = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'executed',
              data: { strategy: 'succeed' },
              metadata: {
                revision: { aggregate: 2 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: mapFailed });
            publishDomainEvent({ domainEvent: executed });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('executed');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });
        });

        test('does not mutate the domain event.', async (): Promise<void> => {
          const applicationDirectory = getTestApplicationDirectory({ name: 'withDomainEventMap' });

          applicationDefinition = await getApplicationDefinition({ applicationDirectory });
          repository = new Repository({ applicationDefinition, domainEventStore });

          ({ api, publishDomainEvent } = await getApi({
            corsOrigin: '*',
            applicationDefinition,
            repository,
            identityProviders
          }));

          const aggregateId = uuid();

          const mapWithMutation = new DomainEventWithState({
            ...buildDomainEvent({
              contextIdentifier: { name: 'sampleContext' },
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              name: 'mapWithMutation',
              data: {},
              metadata: {
                revision: { aggregate: 1 },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
              }
            }),
            state: { previous: {}, next: {}}
          });

          setTimeout(async (): Promise<void> => {
            publishDomainEvent({ domainEvent: mapWithMutation });
          }, 50);

          await new Promise((resolve, reject): void => {
            try {
              supertest(api).get('/v2/').pipe(asJsonStream<DomainEvent<DomainEventData>>(
                (domainEvent): void => {
                  assert.that(domainEvent).is.equalTo({ name: 'heartbeat' });
                },
                (domainEvent): void => {
                  assert.that(domainEvent.name).is.equalTo('mapWithMutation');
                  resolve();
                }
              ));
            } catch (ex) {
              reject(ex);
            }
          });

          assert.that((mapWithMutation.data as any).isMutated).is.undefined();
        });
      });
    });
  });
});

import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { getApi } from '../../../../lib/apis/observeDomainEvents/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory/InMemoryDomainEventStore';
import { PublishDomainEvent } from '../../../../lib/apis/observeDomainEvents/PublishDomainEvent';
import qs from 'qs';
import { Repository } from '../../../../lib/common/domain/Repository';
import { runAsServer } from '../../../shared/http/runAsServer';
import { sleep } from '../../../../lib/common/utils/sleep';
import { uuid } from 'uuidv4';

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

      test('returns the status code 200.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: '/v2/description'
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns application/json.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { headers } = await client({
          method: 'get',
          url: '/v2/description'
        });

        assert.that(headers['content-type']).is.equalTo('application/json; charset=utf-8');
      });

      test('returns the domain events description.', async (): Promise<void> => {
        const client = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/description'
        });

        const { domainEvents: domainEventsDescription } = getApplicationDescription({
          applicationDefinition
        });

        // Convert and parse as JSON, to get rid of any values that are undefined.
        // This is what the HTTP API does internally, and here we need to simulate
        // this to make things work.
        const expectedDomainEventsDescription =
          JSON.parse(JSON.stringify(domainEventsDescription));

        assert.that(data).is.equalTo(expectedDomainEventsDescription);
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

        const client = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
              resolve();
            }
          ));
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

        const client = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.name).is.equalTo('succeeded');
              assert.that(streamElement.data).is.equalTo({});
            },
            (streamElement: any): void => {
              assert.that(streamElement.name).is.equalTo('executed');
              assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
              resolve();
            }
          ));
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

        const client = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/',
          params: { name: 'executed' },
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.name).is.equalTo('executed');
              assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
              resolve();
            }
          ));
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

        const client = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/',
          params: {
            contextIdentifier: { name: 'sampleContext' },
            name: 'executed'
          },
          paramsSerializer (params): string {
            return qs.stringify(params);
          },
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.name).is.equalTo('executed');
              assert.that(streamElement.data).is.equalTo({ strategy: 'succeed' });
              resolve();
            }
          ));
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

        const client = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/',
          responseType: 'stream'
        });

        await new Promise((resolve, reject): void => {
          data.on('error', (err: any): void => {
            reject(err);
          });

          data.on('close', (): void => {
            resolve();
          });

          data.pipe(asJsonStream(
            (streamElement): void => {
              assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
            },
            (streamElement: any): void => {
              assert.that(streamElement.state).is.undefined();
              resolve();
            }
          ));
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

        const client = await runAsServer({ app: api });

        try {
          await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream',
            timeout: 100
          });
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('executed');
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('executed');
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('authorizationWithMutation');
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('filterPassed');
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('executed');
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('executed');
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('filterWithMutation');
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('mapApplied');
                assert.that(streamElement.data).is.equalTo({ isMapped: true });
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('executed');
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('executed');
                resolve();
              }
            ));
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

          const client = await runAsServer({ app: api });

          const { data } = await client({
            method: 'get',
            url: '/v2/',
            responseType: 'stream'
          });

          await new Promise((resolve, reject): void => {
            data.on('error', (err: any): void => {
              reject(err);
            });

            data.on('close', (): void => {
              resolve();
            });

            data.pipe(asJsonStream(
              (streamElement): void => {
                assert.that(streamElement).is.equalTo({ name: 'heartbeat' });
              },
              (streamElement: any): void => {
                assert.that(streamElement.name).is.equalTo('mapWithMutation');
                resolve();
              }
            ));
          });

          assert.that((mapWithMutation.data as any).isMutated).is.undefined();
        });
      });
    });
  });
});

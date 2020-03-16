import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildCommandWithMetadata } from '../../../shared/buildCommandWithMetadata';
import { CustomError } from 'defekt';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { handleCommand } from '../../../../lib/common/domain/handleCommand';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory';
import { InMemoryLockStore } from '../../../../lib/stores/lockStore/InMemory';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { Repository } from '../../../../lib/common/domain/Repository';
import { State } from '../../../../lib/common/elements/State';
import { uuid } from 'uuidv4';
import { waitForSignals } from 'wait-for-signals';

suite('handleCommand', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let applicationDefinition: ApplicationDefinition,
      domainEventStore: DomainEventStore,
      lockStore: LockStore,
      repository: Repository;

  setup(async (): Promise<void> => {
    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
    domainEventStore = await InMemoryDomainEventStore.create();
    lockStore = await InMemoryLockStore.create({});
    repository = new Repository({
      applicationDefinition,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' })
    });
  });

  suite('validation', (): void => {
    test(`throws an error if the data of a command doesn't match its schema.`, async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: uuid()
      };

      const command = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'execute',
        data: {
          foo: 'bar'
        }
      });

      await assert.that(async (): Promise<any> => await handleCommand({
        command,
        applicationDefinition,
        lockStore,
        repository,
        async publishDomainEvents (): Promise<void> {
          // Intentionally left empty
        }
      })).is.throwingAsync(
        (ex): boolean =>
          (ex as CustomError).code === 'ECOMMANDMALFORMED' &&
          ex.message === 'Missing required property: strategy (at command.data.strategy).'
      );
    });
  });

  suite('authorization', (): void => {
    test(`publishes (and does not store) a rejected event if the sender of a command is not authorized.`, async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: uuid()
      };

      const command = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'authorize',
        data: {
          shouldAuthorize: false
        }
      });

      const collector = waitForSignals({ count: 1 });

      // eslint-disable-next-line unicorn/consistent-function-scoping
      const publishDomainEvents = async ({ domainEvents }: {
        domainEvents: DomainEventWithState<DomainEventData, State>[];
      }): Promise<void> => {
        try {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0]).is.atLeast({
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier,
            name: 'authorizeRejected',
            data: {
              reason: 'Command not authorized.'
            }
          });

          await collector.signal();
        } catch (ex) {
          await collector.fail(ex);
        }
      };

      await handleCommand({
        command,
        applicationDefinition,
        lockStore,
        repository,
        publishDomainEvents
      });

      await collector.promise;

      assert.that(
        await domainEventStore.getLastDomainEvent({ aggregateIdentifier })
      ).is.undefined();
    });

    test('passes the correct state to the isAuthorized handler.', async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: uuid()
      };

      const command = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'authorize',
        data: {
          shouldAuthorize: true
        }
      });

      const collector = waitForSignals({ count: 1 });

      // eslint-disable-next-line unicorn/consistent-function-scoping
      const publishDomainEvents = async ({ domainEvents }: {
        domainEvents: DomainEventWithState<DomainEventData, State>[];
      }): Promise<void> => {
        try {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0]).is.atLeast({
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier,
            name: 'authorized',
            data: {}
          });

          await collector.signal();
        } catch (ex) {
          await collector.fail(ex);
        }
      };

      await handleCommand({
        command,
        applicationDefinition,
        lockStore,
        repository,
        publishDomainEvents
      });

      await collector.promise;

      assert.that(
        await domainEventStore.getLastDomainEvent({ aggregateIdentifier })
      ).is.not.undefined();
    });
  });

  suite('handling', (): void => {
    test('publishes (and stores) an appropriate event for the incoming command.', async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: uuid()
      };

      const command = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      const collector = waitForSignals({ count: 1 });

      // eslint-disable-next-line unicorn/consistent-function-scoping
      const publishDomainEvents = async ({ domainEvents }: {
        domainEvents: DomainEventWithState<DomainEventData, State>[];
      }): Promise<void> => {
        try {
          assert.that(domainEvents.length).is.equalTo(2);
          assert.that(domainEvents[0]).is.atLeast({
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier,
            name: 'succeeded',
            data: {}
          });
          assert.that(domainEvents[1]).is.atLeast({
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier,
            name: 'executed',
            data: {
              strategy: 'succeed'
            }
          });

          await collector.signal();
        } catch (ex) {
          await collector.fail(ex);
        }
      };

      await handleCommand({
        command,
        applicationDefinition,
        lockStore,
        repository,
        publishDomainEvents
      });

      await collector.promise;

      const eventStream = await domainEventStore.getReplayForAggregate({ aggregateId: aggregateIdentifier.id });

      await new Promise((resolve, reject): void => {
        eventStream.on('error', (err: any): void => {
          reject(err);
        });
        eventStream.on('close', (): void => {
          resolve();
        });
        eventStream.pipe(asJsonStream(
          [
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (): void => {
              reject(new Error('Should only have received twe messages.'));
            }
          ],
          true
        ));
      });
    });

    test('publishes (and does not store) a rejected event if a handler rejects.', async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: uuid()
      };

      const command = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'reject'
        }
      });

      const collector = waitForSignals({ count: 1 });

      // eslint-disable-next-line unicorn/consistent-function-scoping
      const publishDomainEvents = async ({ domainEvents }: {
        domainEvents: DomainEventWithState<DomainEventData, State>[];
      }): Promise<void> => {
        try {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0]).is.atLeast({
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier,
            name: 'executeRejected',
            data: {
              reason: 'Intentionally rejected execute.'
            }
          });

          await collector.signal();
        } catch (ex) {
          await collector.fail(ex);
        }
      };

      await handleCommand({
        command,
        applicationDefinition,
        lockStore,
        repository,
        publishDomainEvents
      });

      await collector.promise;

      assert.that(
        await domainEventStore.getLastDomainEvent({ aggregateIdentifier })
      ).is.undefined();
    });

    test('publishes (and does not store) a failed event if a handler throws an unknow exception.', async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: uuid()
      };

      const command = buildCommandWithMetadata({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'fail'
        }
      });

      const collector = waitForSignals({ count: 1 });

      // eslint-disable-next-line unicorn/consistent-function-scoping
      const publishDomainEvents = async ({ domainEvents }: {
        domainEvents: DomainEventWithState<DomainEventData, State>[];
      }): Promise<void> => {
        try {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0]).is.atLeast({
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier,
            name: 'executeFailed',
            data: {
              reason: 'Intentionally failed execute.'
            }
          });

          await collector.signal();
        } catch (ex) {
          await collector.fail(ex);
        }
      };

      await handleCommand({
        command,
        applicationDefinition,
        lockStore,
        repository,
        publishDomainEvents
      });

      await collector.promise;

      assert.that(
        await domainEventStore.getLastDomainEvent({ aggregateIdentifier })
      ).is.undefined();
    });
  });
});

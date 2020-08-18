import { AggregateInstance } from '../../../../lib/common/domain/AggregateInstance';
import { Application } from '../../../../lib/common/application/Application';
import { asJsonStream } from '../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildCommandWithMetadata } from '../../../../lib/common/utils/test/buildCommandWithMetadata';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { createDomainEventStore } from '../../../../lib/stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../lib/stores/lockStore/createLockStore';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';
import { createSubscriber } from '../../../../lib/messaging/pubSub/createSubscriber';
import { CustomError } from 'defekt';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { errors } from '../../../../lib/common/errors';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { Notification } from '../../../../lib/common/elements/Notification';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Repository } from '../../../../lib/common/domain/Repository';
import { State } from '../../../../lib/common/elements/State';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { toArray } from 'streamtoarray';
import { v4 } from 'uuid';

suite('AggregateInstance', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let aggregateId: string,
      aggregateInstance: AggregateInstance<State>,
      application: Application,
      domainEventStore: DomainEventStore,
      lockStore: LockStore,
      publisher: Publisher<Notification>,
      pubSubChannelForNotifications: string,
      repository: Repository,
      subscriber: Subscriber<Notification>;

  setup(async (): Promise<void> => {
    aggregateId = v4();

    application = await loadApplication({ applicationDirectory });

    domainEventStore = await createDomainEventStore({ type: 'InMemory' });
    lockStore = await createLockStore({ type: 'InMemory' });
    publisher = await createPublisher<Notification>({ type: 'InMemory' });
    subscriber = await createSubscriber<Notification>({ type: 'InMemory' });
    pubSubChannelForNotifications = 'notifications';
    repository = new Repository({
      application,
      lockStore,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' }),
      publisher,
      pubSubChannelForNotifications
    });

    aggregateInstance = await AggregateInstance.create({
      application,
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
      lockStore,
      domainEventStore,
      repository,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' }),
      publisher,
      pubSubChannelForNotifications
    });
  });

  suite('contextIdentifier', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(aggregateInstance.contextIdentifier).is.equalTo({
        name: 'sampleContext'
      });
    });
  });

  suite('aggregateIdentifier', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(aggregateInstance.aggregateIdentifier).is.equalTo({
        name: 'sampleAggregate',
        id: aggregateId
      });
    });
  });

  suite('state', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(aggregateInstance.state).is.equalTo({
        domainEventNames: []
      });
    });
  });

  suite('revision', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(aggregateInstance.revision).is.equalTo(0);
    });
  });

  suite('unstoredDomainEvents', (): void => {
    test('is initialized with the given value.', async (): Promise<void> => {
      assert.that(aggregateInstance.unstoredDomainEvents).is.equalTo([]);
    });
  });

  suite('applySnapshot', (): void => {
    test(`throws an error if the id of the snapshot's aggregate identifier does not match.`, async (): Promise<void> => {
      const snapshotAggregateIdentifierId = v4();

      assert.that((): void => {
        aggregateInstance.applySnapshot({
          snapshot: {
            aggregateIdentifier: { name: 'sampleAggregate', id: snapshotAggregateIdentifierId },
            revision: 1,
            state: {
              domainEventNames: [ 'executed' ]
            }
          }
        });
      }).is.throwing((ex): boolean => (ex as CustomError).code === errors.IdentifierMismatch.code && ex.message === 'Failed to apply snapshot. Aggregate id does not match.');
    });

    test('updates the state.', async (): Promise<void> => {
      aggregateInstance.applySnapshot({
        snapshot: {
          aggregateIdentifier: aggregateInstance.aggregateIdentifier,
          revision: 1,
          state: {
            domainEventNames: [ 'executed' ]
          }
        }
      });

      assert.that(aggregateInstance.state).is.equalTo({
        domainEventNames: [ 'executed' ]
      });
    });

    test('updates the revision.', async (): Promise<void> => {
      aggregateInstance.applySnapshot({
        snapshot: {
          aggregateIdentifier: aggregateInstance.aggregateIdentifier,
          revision: 1,
          state: {
            domainEventNames: [ 'executed' ]
          }
        }
      });

      assert.that(aggregateInstance.revision).is.equalTo(1);
    });
  });

  suite('isPristine', (): void => {
    test('returns true when the revision is 0.', async (): Promise<void> => {
      assert.that(aggregateInstance.isPristine()).is.true();
    });

    test('returns false when the revision is greater than 0.', async (): Promise<void> => {
      aggregateInstance.applySnapshot({
        snapshot: {
          aggregateIdentifier: aggregateInstance.aggregateIdentifier,
          revision: 1,
          state: {
            domainEventNames: [ 'executed' ]
          }
        }
      });

      assert.that(aggregateInstance.isPristine()).is.false();
    });
  });

  suite('applyDomainEvent', (): void => {
    test('throws an error if the context name does not match.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'nonExistent' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executed',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: 1
        }
      });

      assert.that((): void => {
        aggregateInstance.applyDomainEvent({ application, domainEvent });
      }).is.throwing('Context name does not match.');
    });

    test('throws an error if the aggregate name does not match.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'nonExistent', id: aggregateId },
        name: 'executed',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: 1
        }
      });

      assert.that((): void => {
        aggregateInstance.applyDomainEvent({ application, domainEvent });
      }).is.throwing('Aggregate name does not match.');
    });

    test('throws an error if the aggregate id does not match.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'executed',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: 1
        }
      });

      assert.that((): void => {
        aggregateInstance.applyDomainEvent({ application, domainEvent });
      }).is.throwing('Aggregate id does not match.');
    });

    test('throws an error if the event is not known.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'nonExistent',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: 1
        }
      });

      assert.that((): void => {
        aggregateInstance.applyDomainEvent({ application, domainEvent });
      }).is.throwing(`Failed to apply unknown domain event 'nonExistent' in 'sampleContext.sampleAggregate'.`);
    });

    test('returns the next state.', async (): Promise<void> => {
      const domainEvent = buildDomainEvent({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'executed',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          revision: 1
        }
      });

      const nextState = aggregateInstance.applyDomainEvent({ application, domainEvent });

      assert.that(nextState).is.equalTo({
        domainEventNames: [ 'executed' ]
      });
    });
  });

  suite('handleCommand', (): void => {
    suite('validation', (): void => {
      test(`throws an error if the data of a command doesn't match its schema.`, async (): Promise<void> => {
        const aggregateIdentifier = {
          name: 'sampleAggregate',
          id: v4()
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

        await assert.that(async (): Promise<any> => await aggregateInstance.handleCommand({
          command
        })).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === errors.CommandMalformed.code &&
              ex.message === 'Missing required property: strategy (at command.data.strategy).'
        );
      });
    });

    suite('authorization', (): void => {
      test(`publishes (and does not store) a rejected event if the sender of a command is not authorized.`, async (): Promise<void> => {
        const { aggregateIdentifier } = aggregateInstance;

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

        const domainEvents = await aggregateInstance.handleCommand({
          command
        });

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

        assert.that(
          await domainEventStore.getLastDomainEvent({ aggregateIdentifier })
        ).is.undefined();
      });

      test('passes the correct state to the isAuthorized handler.', async (): Promise<void> => {
        const { aggregateIdentifier } = aggregateInstance;

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

        const domainEvents = await aggregateInstance.handleCommand({
          command
        });

        assert.that(domainEvents.length).is.equalTo(1);
        assert.that(domainEvents[0]).is.atLeast({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier,
          name: 'authorized',
          data: {}
        });

        assert.that(
          await domainEventStore.getLastDomainEvent({ aggregateIdentifier })
        ).is.not.undefined();
      });
    });

    suite('handling', (): void => {
      test('publishes (and stores) an appropriate event for the incoming command.', async (): Promise<void> => {
        const { aggregateIdentifier } = aggregateInstance;

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

        const domainEvents = await aggregateInstance.handleCommand({
          command
        });

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

      test('updates the state.', async (): Promise<void> => {
        const { aggregateIdentifier } = aggregateInstance;

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

        await aggregateInstance.handleCommand({
          command
        });

        assert.that(aggregateInstance.state).is.equalTo({
          domainEventNames: [ 'succeeded', 'executed' ]
        });
      });

      test('publishes (and does not store) a rejected event if a handler rejects.', async (): Promise<void> => {
        const { aggregateIdentifier } = aggregateInstance;

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

        const domainEvents = await aggregateInstance.handleCommand({
          command
        });

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

        assert.that(
          await domainEventStore.getLastDomainEvent({ aggregateIdentifier })
        ).is.undefined();
      });

      test('publishes (and does not store) a failed event if a handler throws an unknow exception.', async (): Promise<void> => {
        const { aggregateIdentifier } = aggregateInstance;

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

        const domainEvents = await aggregateInstance.handleCommand({
          command
        });

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

        assert.that(
          await domainEventStore.getLastDomainEvent({ aggregateIdentifier })
        ).is.undefined();
      });
    });

    suite('notifications', (): void => {
      test('publishes notifications from the command handle.', async (): Promise<void> => {
        const notifications: Notification[] = [];

        await subscriber.subscribe({
          channel: pubSubChannelForNotifications,
          callback (notification): void {
            notifications.push(notification);
          }
        });

        const { aggregateIdentifier } = aggregateInstance;

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

        await aggregateInstance.handleCommand({
          command
        });

        assert.that(notifications.length).is.equalTo(1);
        assert.that(notifications[0]).is.equalTo({
          name: 'commandExecute',
          data: {},
          metadata: undefined
        });
      });
    });
  });

  suite('storeCurrentAggregateState', (): void => {
    test('does nothing if there are no unstored domain events.', async (): Promise<void> => {
      await aggregateInstance.storeCurrentAggregateState();

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId
      });

      const domainEvents = await toArray(domainEventStream);

      assert.that(domainEvents.length).is.equalTo(0);
    });

    test('stores a single unstored domain event to the domain event store.', async (): Promise<void> => {
      aggregateInstance.unstoredDomainEvents.push(
        new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: aggregateInstance.contextIdentifier,
            aggregateIdentifier: aggregateInstance.aggregateIdentifier,
            name: 'executed',
            data: {
              strategy: 'succeed'
            },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          }),
          state: {
            previous: {
              domainEventNames: []
            },
            next: {
              domainEventNames: [ 'executed' ]
            }
          }
        })
      );

      await aggregateInstance.storeCurrentAggregateState();

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId
      });

      const domainEvents: DomainEvent<DomainEventData>[] = await toArray(domainEventStream);

      assert.that(domainEvents.length).is.equalTo(1);
      assert.that(domainEvents[0].name).is.equalTo('executed');
      assert.that(domainEvents[0].data).is.equalTo({
        strategy: 'succeed'
      });
    });

    test('stores multiple unstored domain events to the domain event store.', async (): Promise<void> => {
      aggregateInstance.unstoredDomainEvents.push(
        new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: aggregateInstance.contextIdentifier,
            aggregateIdentifier: aggregateInstance.aggregateIdentifier,
            name: 'succeeded',
            data: {},
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          }),
          state: {
            previous: {
              domainEventNames: []
            },
            next: {
              domainEventNames: [ 'succeeded' ]
            }
          }
        })
      );
      aggregateInstance.unstoredDomainEvents.push(
        new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: aggregateInstance.contextIdentifier,
            aggregateIdentifier: aggregateInstance.aggregateIdentifier,
            name: 'executed',
            data: {
              strategy: 'succeed'
            },
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 2
            }
          }),
          state: {
            previous: {
              domainEventNames: [ 'succeeded' ]
            },
            next: {
              domainEventNames: [ 'succeeded', 'executed' ]
            }
          }
        })
      );

      await aggregateInstance.storeCurrentAggregateState();

      const domainEventStream = await domainEventStore.getReplayForAggregate({
        aggregateId
      });

      const domainEvents: DomainEvent<DomainEventData>[] = await toArray(domainEventStream);

      assert.that(domainEvents.length).is.equalTo(2);
      assert.that(domainEvents[0].name).is.equalTo('succeeded');
      assert.that(domainEvents[0].data).is.equalTo({});
      assert.that(domainEvents[1].name).is.equalTo('executed');
      assert.that(domainEvents[1].data).is.equalTo({
        strategy: 'succeed'
      });
    });
  });
});

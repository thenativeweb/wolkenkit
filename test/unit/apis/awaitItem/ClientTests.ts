import { assert } from 'assertthat';
import { buildCommandWithMetadata } from '../../../../lib/common/utils/test/buildCommandWithMetadata';
import { Client } from '../../../../lib/apis/awaitItem/http/v2/Client';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { createPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/createPriorityQueueStore';
import { CustomError } from 'defekt';
import { doesItemIdentifierWithClientMatchCommandWithMetadata } from '../../../../lib/common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/awaitItem/http';
import { getCommandWithMetadataSchema } from '../../../../lib/common/schemas/getCommandWithMetadataSchema';
import { getPromiseStatus } from '../../../../lib/common/utils/getPromiseStatus';
import { InMemoryPublisher } from '../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher';
import { InMemorySubscriber } from '../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber';
import { ItemIdentifier } from '../../../../lib/common/elements/ItemIdentifier';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { runAsServer } from '../../../shared/http/runAsServer';
import { sleep } from '../../../../lib/common/utils/sleep';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { v4 } from 'uuid';
import { Value } from 'validate-value';

suite('awaitItem/http/Client', (): void => {
  suite('/v2', (): void => {
    const expirationTime = 600;
    const pollInterval = 500;

    let api: ExpressApplication,
        newItemPublisher: Publisher<object>,
        newItemSubscriber: Subscriber<object>,
        newItemSubscriberChannel: string,
        priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;

    setup(async (): Promise<void> => {
      newItemSubscriber = await InMemorySubscriber.create({ type: 'InMemory' });
      newItemSubscriberChannel = v4();
      newItemPublisher = await InMemoryPublisher.create({ type: 'InMemory' });

      priorityQueueStore = await createPriorityQueueStore({
        type: 'InMemory',
        doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata,
        expirationTime
      });

      ({ api } = await getApi({
        corsOrigin: '*',
        priorityQueueStore: priorityQueueStore as PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifier>,
        newItemSubscriber,
        newItemSubscriberChannel,
        validateOutgoingItem ({ item }: { item: any }): void {
          new Value(getCommandWithMetadataSchema()).validate(item);
        }
      }));
    });

    suite('awaitItem', (): void => {
      test('retrieves a lock item.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: 'foo',
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        const command = await client.awaitItem();

        assert.that(command.item).is.equalTo(commandWithMetadata);
        assert.that(command.metadata.token).is.ofType('string');
        assert.that(command.metadata.discriminator).is.equalTo('foo');
      });
    });

    suite('renewLock', (): void => {
      test('throws a request malformed error if the discriminator is too short.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => await client.renewLock({
          discriminator: '' as any,
          token: v4()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.RequestMalformed.code &&
            ex.message === 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).'
        );
      });

      test(`throws an item not found error if the item doesn't exist.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => client.renewLock({
          discriminator: v4(),
          token: v4()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ItemNotFound.code
        );
      });

      test(`throws an item not locked error if the item isn't locked.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await assert.that(async (): Promise<any> => client.renewLock({
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          token: v4()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ItemNotLocked.code
        );
      });

      test(`throws a token mismatched error if the token doesn't match.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await client.awaitItem();

        await assert.that(async (): Promise<any> => client.renewLock({
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          token: v4()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.TokenMismatch.code &&
            ex.message === `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.aggregate.id}'.`
        );
      });

      test('extends the lock expiry time.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        const { item, metadata: { token }} = await client.awaitItem();

        await sleep({ ms: 0.6 * expirationTime });

        await client.renewLock({ discriminator: item.aggregateIdentifier.aggregate.id, token });

        await sleep({ ms: 0.6 * expirationTime });

        const notResolvingPromise = client.awaitItem();

        await sleep({ ms: pollInterval });

        assert.that(await getPromiseStatus(notResolvingPromise)).is.equalTo('pending');
      });
    });

    suite('acknowledge', (): void => {
      test('throws a request malformed error if the discriminator is too short.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => await client.acknowledge({
          discriminator: '',
          token: v4()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.RequestMalformed.code &&
            ex.message === 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).'
        );
      });

      test(`throws an item not found error if the item doesn't exist.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => client.acknowledge({
          discriminator: v4(),
          token: v4()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ItemNotFound.code
        );
      });

      test(`throws an item not locked error if the item isn't locked.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await assert.that(async (): Promise<any> => client.acknowledge({
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          token: v4()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ItemNotLocked.code
        );
      });

      test(`throws a token mismatched error if the token doesn't match.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await client.awaitItem();

        await assert.that(async (): Promise<any> => client.acknowledge({
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          token: v4()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.TokenMismatch.code &&
            ex.message === `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.aggregate.id}'.`
        );
      });

      test('removes the item from the queue and lets the next item for the same aggregate pass.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const aggregateId = v4();
        const commandOne = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'execute',
          data: {}
        });
        const commandTwo = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandOne,
          discriminator: commandOne.aggregateIdentifier.aggregate.id,
          priority: commandOne.metadata.timestamp
        });
        await priorityQueueStore.enqueue({
          item: commandTwo,
          discriminator: commandTwo.aggregateIdentifier.aggregate.id,
          priority: commandTwo.metadata.timestamp
        });

        const { item, metadata: { token }} = await client.awaitItem();

        const commandWithMetadata = new CommandWithMetadata(item);

        await client.acknowledge({
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          token
        });

        // This should resolve. A timeout in this test means, that this can not
        // fetch a command.
        await client.awaitItem();
      });
    });

    suite('defer', (): void => {
      test('throws a request malformed error if the discriminator is too short.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => await client.defer({
          discriminator: '',
          token: v4(),
          priority: Date.now()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.RequestMalformed.code &&
            ex.message === 'String is too short (0 chars), minimum 1 (at requestBody.discriminator).'
        );
      });

      test(`throws an item not found error if the item doesn't exist.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => client.defer({
          discriminator: v4(),
          token: v4(),
          priority: Date.now()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ItemNotFound.code
        );
      });

      test(`throws an item not locked error if the item isn't locked.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await assert.that(async (): Promise<any> => client.defer({
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          token: v4(),
          priority: Date.now()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.ItemNotLocked.code
        );
      });

      test(`throws a token mismatched error if the token doesn't match.`, async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: v4()
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await client.awaitItem();

        await assert.that(async (): Promise<any> => client.defer({
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          token: v4(),
          priority: Date.now()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.TokenMismatch.code &&
                ex.message === `Token mismatch for discriminator '${commandWithMetadata.aggregateIdentifier.aggregate.id}'.`
        );
      });

      test('removes the item from the queue and lets the next item for the same aggregate pass.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>>({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const aggregateId = v4();
        const commandOne = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'execute',
          data: {}
        });
        const commandTwo = buildCommandWithMetadata({
          aggregateIdentifier: {
            context: {
              name: 'sampleContext'
            },
            aggregate: {
              name: 'sampleAggregate',
              id: aggregateId
            }
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandOne,
          discriminator: commandOne.aggregateIdentifier.aggregate.id,
          priority: commandOne.metadata.timestamp
        });
        await priorityQueueStore.enqueue({
          item: commandTwo,
          discriminator: commandTwo.aggregateIdentifier.aggregate.id,
          priority: commandTwo.metadata.timestamp
        });

        const { item, metadata: { token }} = await client.awaitItem();

        const commandWithMetadata = new CommandWithMetadata(item);

        await client.defer({
          discriminator: commandWithMetadata.aggregateIdentifier.aggregate.id,
          token,
          priority: Date.now()
        });

        const { item: nextItem, metadata: { token: nextToken }} = await client.awaitItem();

        const nextCommandWithMetadata = new CommandWithMetadata(nextItem);

        await client.acknowledge({
          discriminator: nextCommandWithMetadata.aggregateIdentifier.aggregate.id,
          token: nextToken
        });

        // This should resolve. A timeout in this test means, that this can not
        // fetch a command.
        await client.awaitItem();
      });
    });
  });
});

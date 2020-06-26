import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { buildCommandWithMetadata } from '../../../../lib/common/utils/test/buildCommandWithMetadata';
import { Client } from '../../../../lib/apis/awaitItem/http/v2/Client';
import { CommandData } from '../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { createPriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/createPriorityQueueStore';
import { CustomError } from 'defekt';
import { doesItemIdentifierWithClientMatchCommandWithMetadata } from '../../../../lib/common/domain/doesItemIdentifierWithClientMatchCommandWithMetadata';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/awaitItem/http';
import { getCommandWithMetadataSchema } from '../../../../lib/common/schemas/getCommandWithMetadataSchema';
import { getPromiseStatus } from '../../../../lib/common/utils/getPromiseStatus';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { InMemoryPublisher } from '../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher';
import { InMemorySubscriber } from '../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber';
import { ItemIdentifier } from '../../../../lib/common/elements/ItemIdentifier';
import { ItemIdentifierWithClient } from '../../../../lib/common/elements/ItemIdentifierWithClient';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { PriorityQueueStore } from '../../../../lib/stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { runAsServer } from '../../../shared/http/runAsServer';
import { sleep } from '../../../../lib/common/utils/sleep';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { uuid } from 'uuidv4';
import { Value } from 'validate-value';

suite('awaitItem/http/Client', (): void => {
  suite('/v2', (): void => {
    const expirationTime = 600;
    const pollInterval = 500;

    let api: ExpressApplication,
        application: Application,
        newItemPublisher: Publisher<object>,
        newItemSubscriber: Subscriber<object>,
        newItemSubscriberChannel: string,
        priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;

    setup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      application = await loadApplication({ applicationDirectory });

      newItemSubscriber = await InMemorySubscriber.create();
      newItemSubscriberChannel = uuid();
      newItemPublisher = await InMemoryPublisher.create();

      priorityQueueStore = await createPriorityQueueStore({
        type: 'InMemory',
        doesIdentifierMatchItem: doesItemIdentifierWithClientMatchCommandWithMetadata,
        options: { expirationTime }
      });

      ({ api } = await getApi({
        application,
        corsOrigin: '*',
        priorityQueueStore,
        newItemSubscriber,
        newItemSubscriberChannel,
        validateOutgoingItem ({ item }: { item: any }): void {
          new Value(getCommandWithMetadataSchema()).validate(item);
        }
      }));
    });

    suite('awaitItem', (): void => {
      test('retrieves a lock item.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        const command = await client.awaitItem();

        assert.that(command.item).is.equalTo(commandWithMetadata);
        assert.that(command.token).is.ofType('string');
      });
    });

    suite('renewLock', (): void => {
      test('throws an item identifier malformed error if the item identifier is malformed.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => await client.renewLock({
          itemIdentifier: {} as any,
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMIDENTIFIERMALFORMED' &&
            ex.message === 'Missing required property: contextIdentifier (at value.itemIdentifier.contextIdentifier).'
        );
      });

      test(`throws an item not found error if the item doesn't exist.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => client.renewLock({
          itemIdentifier: {
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier: {
              name: 'sampleAggregate',
              id: uuid()
            },
            id: uuid(),
            name: 'foo'
          },
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTFOUND'
        );
      });

      test(`throws an item not locked error if the item isn't locked.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await assert.that(async (): Promise<any> => client.renewLock({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTLOCKED'
        );
      });

      test(`throws a token mismatched error if the token doesn't match.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await client.awaitItem();

        await assert.that(async (): Promise<any> => client.renewLock({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'ETOKENMISMATCH' &&
            ex.message === `Token mismatch for item 'sampleContext.sampleAggregate.${commandWithMetadata.aggregateIdentifier.id}.execute.${commandWithMetadata.id}'.`
        );
      });

      test('extends the lock expiry time.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        const { item, token } = await client.awaitItem();

        await sleep({ ms: 0.6 * expirationTime });

        await client.renewLock({ itemIdentifier: item.getItemIdentifier(), token });

        await sleep({ ms: 0.6 * expirationTime });

        const notResolvingPromise = client.awaitItem();

        await sleep({ ms: pollInterval });

        assert.that(await getPromiseStatus(notResolvingPromise)).is.equalTo('pending');
      });
    });

    suite('acknowledge', (): void => {
      test('throws an item identifier malformed error if the item identifier is malformed.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => await client.acknowledge({
          itemIdentifier: {} as any,
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMIDENTIFIERMALFORMED' &&
            ex.message === 'Missing required property: contextIdentifier (at value.itemIdentifier.contextIdentifier).'
        );
      });

      test(`throws an item not found error if the item doesn't exist.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => client.acknowledge({
          itemIdentifier: {
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier: {
              name: 'sampleAggregate',
              id: uuid()
            },
            id: uuid(),
            name: 'foo'
          },
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTFOUND'
        );
      });

      test(`throws an item not locked error if the item isn't locked.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await assert.that(async (): Promise<any> => client.acknowledge({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTLOCKED'
        );
      });

      test(`throws a token mismatched error if the token doesn't match.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await client.awaitItem();

        await assert.that(async (): Promise<any> => client.acknowledge({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'ETOKENMISMATCH' &&
            ex.message === `Token mismatch for item 'sampleContext.sampleAggregate.${commandWithMetadata.aggregateIdentifier.id}.execute.${commandWithMetadata.id}'.`
        );
      });

      test('removes the item from the queue and lets the next item for the same aggregate pass.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const aggregateId = uuid();
        const commandOne = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          data: {}
        });
        const commandTwo = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandOne,
          discriminator: commandOne.aggregateIdentifier.id,
          priority: commandOne.metadata.timestamp
        });
        await priorityQueueStore.enqueue({
          item: commandTwo,
          discriminator: commandTwo.aggregateIdentifier.id,
          priority: commandTwo.metadata.timestamp
        });

        const { item, token } = await client.awaitItem();

        const commandWithMetadata = new CommandWithMetadata(item);

        await client.acknowledge({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token
        });

        // This should resolve. A timeout in this test means, that this can not
        // fetch a command.
        await client.awaitItem();
      });
    });

    suite('defer', (): void => {
      test('throws an item identifier malformed error if the item identifier is malformed.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => await client.defer({
          itemIdentifier: {} as any,
          token: uuid(),
          priority: Date.now()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EREQUESTMALFORMED' &&
            ex.message === 'Missing required property: contextIdentifier (at value.itemIdentifier.contextIdentifier).'
        );
      });

      test(`throws an item not found error if the item doesn't exist.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        await assert.that(async (): Promise<any> => client.defer({
          itemIdentifier: {
            contextIdentifier: {
              name: 'sampleContext'
            },
            aggregateIdentifier: {
              name: 'sampleAggregate',
              id: uuid()
            },
            id: uuid(),
            name: 'foo'
          },
          token: uuid(),
          priority: Date.now()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTFOUND'
        );
      });

      test(`throws an item not locked error if the item isn't locked.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await assert.that(async (): Promise<any> => client.defer({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid(),
          priority: Date.now()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'EITEMNOTLOCKED'
        );
      });

      test(`throws a token mismatched error if the token doesn't match.`, async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const commandWithMetadata = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: uuid()
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandWithMetadata,
          discriminator: commandWithMetadata.aggregateIdentifier.id,
          priority: commandWithMetadata.metadata.timestamp
        });
        await newItemPublisher.publish({
          channel: newItemSubscriberChannel,
          message: {}
        });

        await client.awaitItem();

        await assert.that(async (): Promise<any> => client.defer({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token: uuid(),
          priority: Date.now()
        })).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === 'ETOKENMISMATCH' &&
            ex.message === `Token mismatch for item 'sampleContext.sampleAggregate.${commandWithMetadata.aggregateIdentifier.id}.execute.${commandWithMetadata.id}'.`
        );
      });

      test('removes the item from the queue and lets the next item for the same aggregate pass.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client<CommandWithMetadata<CommandData>, ItemIdentifier>({
          hostName: 'localhost',
          port,
          path: '/v2',
          createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
        });

        const aggregateId = uuid();
        const commandOne = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          data: {}
        });
        const commandTwo = buildCommandWithMetadata({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'execute',
          data: {}
        });

        await priorityQueueStore.enqueue({
          item: commandOne,
          discriminator: commandOne.aggregateIdentifier.id,
          priority: commandOne.metadata.timestamp
        });
        await priorityQueueStore.enqueue({
          item: commandTwo,
          discriminator: commandTwo.aggregateIdentifier.id,
          priority: commandTwo.metadata.timestamp
        });

        const { item, token } = await client.awaitItem();

        const commandWithMetadata = new CommandWithMetadata(item);

        await client.defer({
          itemIdentifier: commandWithMetadata.getItemIdentifier(),
          token,
          priority: Date.now()
        });

        const { item: nextItem, token: nextToken } = await client.awaitItem();

        const nextCommandWithMetadata = new CommandWithMetadata(nextItem);

        await client.acknowledge({
          itemIdentifier: nextCommandWithMetadata.getItemIdentifier(),
          token: nextToken
        });

        // This should resolve. A timeout in this test means, that this can not
        // fetch a command.
        await client.awaitItem();
      });
    });
  });
});

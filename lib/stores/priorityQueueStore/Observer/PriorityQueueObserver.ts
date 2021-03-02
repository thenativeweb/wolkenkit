import { createPriorityQueueStore } from '../createPriorityQueueStore';
import { LockMetadata } from '../LockMetadata';
import { PassThrough } from 'stream';
import { PriorityQueueObserverOptions } from './PriorityQueueObserverOptions';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { PriorityQueueStoreOptions } from '../PriorityQueueStoreOptions';
import { v4 } from 'uuid';
import { errors as wolkenkitErrors } from '../../../common/errors';
import { defekt, isCustomError } from 'defekt';

interface Item {
  id: string;
}

interface HeapItem<TItem> {
  item: TItem;
  priority: number;
  discriminator: string;
  lockedUntil?: number;
}

interface ObservableItem extends Item {
  observableId: string;
}

interface Issue {
  type: 'action' | 'issue' | 'error';
  message: string;
  data?: any;
}

interface ObserverState {
  enqueuedItems: Map<string, HeapItem<ObservableItem>>;
  lockedItems: Map<string, HeapItem<ObservableItem>>;
  removedItems: Map<string, HeapItem<ObservableItem>>;
  acknowledgedItems: Map<string, HeapItem<ObservableItem>>;
}

const errors = defekt({
  ObserverError: {}
});

class PriorityQueueObserver implements PriorityQueueStore<Item, string> {
  protected queue: PriorityQueueStore<ObservableItem, string>;

  protected events: PassThrough;

  protected enqueuedItems: Map<string, HeapItem<ObservableItem>>;

  protected lockedItems: Map<string, HeapItem<ObservableItem>>;

  protected removedItems: Map<string, HeapItem<ObservableItem>>;

  protected acknowledgedItems: Map<string, HeapItem<ObservableItem>>;

  protected static readonly defaultExpirationTime = 15_000;

  protected queueOptions: PriorityQueueStoreOptions<ObservableItem, string>;

  protected constructor (
    queue: PriorityQueueStore<ObservableItem, string>,
    queueOptions: PriorityQueueStoreOptions<ObservableItem, string>
  ) {
    this.queue = queue;
    this.queueOptions = queueOptions;
    this.events = new PassThrough({ objectMode: true });
    this.enqueuedItems = new Map<string, HeapItem<ObservableItem>>();
    this.lockedItems = new Map<string, HeapItem<ObservableItem>>();
    this.removedItems = new Map<string, HeapItem<ObservableItem>>();
    this.acknowledgedItems = new Map<string, HeapItem<ObservableItem>>();
  }

  protected getState (): ObserverState {
    return {
      enqueuedItems: this.enqueuedItems,
      lockedItems: this.lockedItems,
      removedItems: this.removedItems,
      acknowledgedItems: this.acknowledgedItems
    };
  }

  protected unlockExpiredLocks (): void {
    this.lockedItems.forEach((value, key): void => {
      if (value.lockedUntil === undefined) {
        return;
      }
      if (value.lockedUntil < Date.now()) {
        this.lockedItems.delete(key);
        this.enqueuedItems.set(key, value);
      }
    });
  }

  protected lockHeapItem (heapItem: HeapItem<ObservableItem>): void {
    this.enqueuedItems.delete(heapItem.item.observableId);
    this.lockedItems.set(heapItem.item.observableId, {
      ...heapItem,
      lockedUntil: Date.now() + this.queueOptions.expirationTime!
    });
  }

  public async enqueue (heapItem: HeapItem<Item>): Promise<void> {
    this.unlockExpiredLocks();

    const observableHeapItem: HeapItem<ObservableItem> = {
      ...heapItem,
      item: {
        ...heapItem.item,
        observableId: v4()
      }
    };

    this.events.push({
      type: 'action',
      message: 'enqueue',
      data: observableHeapItem
    });

    try {
      await this.queue.enqueue(observableHeapItem);

      this.enqueuedItems.set(observableHeapItem.item.observableId, observableHeapItem);
    } catch (ex: unknown) {
      this.events.push({
        type: 'error',
        message: 'The queue crashed while enqueueing.',
        data: ex
      });
    }
  }

  public async lockNext (): Promise<{ item: Item; metadata: LockMetadata } | undefined> {
    this.unlockExpiredLocks();

    try {
      const nextItem = await this.queue.lockNext();

      this.events.push({
        type: 'action',
        message: 'lockNext',
        data: nextItem
      });
      if (nextItem === undefined) {
        this.events.push({
          type: 'issue',
          message: 'Couldn\'t lock next item'
        });
      } else {
        const heapItem = this.enqueuedItems.get(nextItem.item.observableId);

        if (heapItem === undefined) {
          throw new errors.ObserverError('An item was locked that should not exist in the queue.', { data: { nextItem }});
        }

        this.lockHeapItem(heapItem);
      }

      return nextItem;
    } catch (ex: unknown) {
      this.events.push({
        type: 'error',
        message: 'The queue crashed while locking next item.',
        data: ex
      });
    }
  }

  public async renewLock ({ discriminator, token }: { discriminator: string; token: string }): Promise<void> {
    this.unlockExpiredLocks();

    try {
      this.events.push({
        type: 'action',
        message: 'renewLock',
        data: { discriminator, token }
      });
      await this.queue.renewLock({ discriminator, token });
      const matchingLocks = [ ...this.lockedItems.entries() ].
        filter(([ , heapItem ]): boolean => heapItem.discriminator === discriminator);

      if (matchingLocks.length > 1) {
        throw new errors.ObserverError('Multiple locks are present for a single discriminator.', { data: { matchingLocks }});
      }
      this.lockedItems.forEach((heapItem, observableId): void => {
        if (heapItem.discriminator === discriminator) {
          this.lockedItems.set(observableId, {
            ...heapItem,
            lockedUntil: Date.now() + this.queueOptions.expirationTime!
          });
        }
      });
    } catch (ex: unknown) {
      if (isCustomError(ex)) {
        switch (ex.code) {
          case wolkenkitErrors.TokenMismatch.code:
          case wolkenkitErrors.ItemNotFound.code:
          case wolkenkitErrors.ItemNotLocked.code: {
            this.events.push({
              type: 'issue',
              message: 'renewLock failed.',
              data: ex
            });

            return;
          }
          default: {
            break;
          }
        }
      }
      this.events.push({
        type: 'error',
        message: 'The queue crashed while renewing a lock.',
        data: ex
      });
    }
  }

  public async acknowledge ({ discriminator, token }: { discriminator: string; token: string }): Promise<void> {
    this.unlockExpiredLocks();

    try {
      this.events.push({
        type: 'action',
        message: 'acknowledge',
        data: { discriminator, token }
      });
      await this.queue.acknowledge({ discriminator, token });

      const matchingLocks = [ ...this.lockedItems.entries() ].
        filter(([ , heapItem ]): boolean => heapItem.discriminator === discriminator);

      if (matchingLocks.length > 1) {
        throw new errors.ObserverError('Multiple locks are present for a single discriminator.', { data: { matchingLocks }});
      }
      this.lockedItems.forEach((heapItem, observableId): void => {
        if (heapItem.discriminator === discriminator) {
          this.lockedItems.delete(observableId);
          this.acknowledgedItems.set(observableId, heapItem);
        }
      });
    } catch (ex: unknown) {
      if (isCustomError(ex)) {
        switch (ex.code) {
          case wolkenkitErrors.TokenMismatch.code:
          case wolkenkitErrors.ItemNotFound.code:
          case wolkenkitErrors.ItemNotLocked.code: {
            this.events.push({
              type: 'issue',
              message: 'acknowledge failed.',
              data: ex
            });

            return;
          }
          default: {
            break;
          }
        }
      }

      this.events.push({
        type: 'error',
        message: 'The queue crashed while acknowledging an item.',
        data: ex
      });
    }
  }

  public async defer ({ discriminator, token, priority }: { discriminator: string; token: string; priority: number }): Promise<void> {
    this.unlockExpiredLocks();

    try {
      this.events.push({
        type: 'action',
        message: 'defer',
        data: { discriminator, token, priority }
      });
      await this.queue.defer({ discriminator, token, priority });

      const matchingLocks = [ ...this.lockedItems.entries() ].
        filter(([ , heapItem ]): boolean => heapItem.discriminator === discriminator);

      if (matchingLocks.length > 1) {
        throw new errors.ObserverError('Multiple locks are present for a single discriminator.', { data: { matchingLocks }});
      }
      this.lockedItems.forEach((heapItem, observableId): void => {
        if (heapItem.discriminator === discriminator) {
          this.lockedItems.delete(observableId);
          this.enqueuedItems.set(observableId, heapItem);
        }
      });
    } catch (ex: unknown) {
      if (isCustomError(ex)) {
        switch (ex.code) {
          case wolkenkitErrors.TokenMismatch.code:
          case wolkenkitErrors.ItemNotFound.code:
          case wolkenkitErrors.ItemNotLocked.code: {
            this.events.push({
              type: 'issue',
              message: 'defer failed.',
              data: ex
            });

            return;
          }
          default: {
            break;
          }
        }
      }
      this.events.push({
        type: 'error',
        message: 'The queue crashed while deferring an item.',
        data: ex
      });
    }
  }

  public async remove ({ discriminator, itemIdentifier }: { discriminator: string; itemIdentifier: string }): Promise<void> {
    this.unlockExpiredLocks();

    try {
      this.events.push({
        type: 'action',
        message: 'remove',
        data: { discriminator, itemIdentifier }
      });
      await this.queue.remove({ discriminator, itemIdentifier });

      this.lockedItems.forEach((heapItem, observableId): void => {
        if (heapItem.item.id === itemIdentifier) {
          this.enqueuedItems.delete(observableId);
          this.removedItems.set(observableId, heapItem);
        }
      });
    } catch (ex: unknown) {
      if (isCustomError(ex)) {
        switch (ex.code) {
          case wolkenkitErrors.ItemNotFound.code: {
            this.events.push({
              type: 'issue',
              message: 'remove failed.',
              data: ex
            });

            return;
          }
          default: {
            break;
          }
        }
      }
      this.events.push({
        type: 'error',
        message: 'The queue crashed while removing an item.',
        data: ex
      });
    }
  }

  public async setup (): Promise<void> {
    return this.queue.setup();
  }

  public static async create (
    { observedQueueOptions }: PriorityQueueObserverOptions
  ): Promise<PriorityQueueObserver> {
    const actualOptions = {
      ...observedQueueOptions,
      expirationTime: observedQueueOptions.expirationTime ?? PriorityQueueObserver.defaultExpirationTime
    };
    const queue = await createPriorityQueueStore(actualOptions);

    return new PriorityQueueObserver(queue, actualOptions);
  }

  public async destroy (): Promise<void> {
    this.events.destroy();

    return this.queue.destroy();
  }

  public getEvents (): PassThrough {
    return this.events;
  }
}

export type {
  HeapItem,
  Issue,
  Item,
  ObservableItem,
  ObserverState,
  PriorityQueueObserverOptions
};

export {
  errors,
  PriorityQueueObserver
};

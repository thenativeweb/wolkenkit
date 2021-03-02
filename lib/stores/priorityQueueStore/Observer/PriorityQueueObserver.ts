import { createPriorityQueueStore } from '../createPriorityQueueStore';
import { LockMetadata } from '../LockMetadata';
import { PriorityQueueObserverOptions } from './PriorityQueueObserverOptions';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { PriorityQueueStoreOptions } from '../PriorityQueueStoreOptions';
import { v4 } from 'uuid';

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

interface Action {
  type: string;
  data: any;
}

interface Issue {
  message: string;
  data?: any;
}

interface ObserverState {
  actionLog: Action[];
  issueLog: Issue[];
  enqueuedItems: Map<string, HeapItem<ObservableItem>>;
  lockedItems: Map<string, HeapItem<ObservableItem>>;
  removedItems: Map<string, HeapItem<ObservableItem>>;
  acknowledgedItems: Map<string, HeapItem<ObservableItem>>;
}

type CrashHandler = (state: ObserverState) => Promise<void>;

class PriorityQueueObserver implements PriorityQueueStore<Item, string> {
  protected queue: PriorityQueueStore<ObservableItem, string>;

  protected actionLog: Action[];

  protected issueLog: Issue[];

  protected crashHandler: CrashHandler;

  protected enqueuedItems: Map<string, HeapItem<ObservableItem>>;

  protected lockedItems: Map<string, HeapItem<ObservableItem>>;

  protected removedItems: Map<string, HeapItem<ObservableItem>>;

  protected acknowledgedItems: Map<string, HeapItem<ObservableItem>>;

  protected static readonly defaultExpirationTime = 15_000;

  protected queueOptions: PriorityQueueStoreOptions<ObservableItem, string>;

  protected constructor (
    queue: PriorityQueueStore<ObservableItem, string>,
    queueOptions: PriorityQueueStoreOptions<ObservableItem, string>,
    crashHandler: CrashHandler
  ) {
    this.queue = queue;
    this.queueOptions = queueOptions;
    this.actionLog = [];
    this.issueLog = [];
    this.crashHandler = crashHandler;
    this.enqueuedItems = new Map<string, HeapItem<ObservableItem>>();
    this.lockedItems = new Map<string, HeapItem<ObservableItem>>();
    this.removedItems = new Map<string, HeapItem<ObservableItem>>();
    this.acknowledgedItems = new Map<string, HeapItem<ObservableItem>>();
  }

  protected getState (): ObserverState {
    return {
      actionLog: this.actionLog,
      issueLog: this.issueLog,
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

    this.actionLog.push({
      type: 'enqueue',
      data: observableHeapItem
    });

    try {
      await this.queue.enqueue(observableHeapItem);

      this.enqueuedItems.set(observableHeapItem.item.observableId, observableHeapItem);
    } catch (ex: unknown) {
      this.issueLog.push({
        message: 'The queue crashed while enqueueing.',
        data: ex
      });
      await this.crashHandler(this.getState());

      throw ex;
    }
  }

  public async lockNext (): Promise<{ item: Item; metadata: LockMetadata } | undefined> {
    this.unlockExpiredLocks();

    try {
      const nextItem = await this.queue.lockNext();

      this.actionLog.push({
        type: 'lockNext',
        data: nextItem
      });
      if (nextItem === undefined) {
        this.issueLog.push({
          message: 'Couldn\'t lock next item'
        });
      } else {
        const heapItem = this.enqueuedItems.get(nextItem.item.observableId);

        if (heapItem === undefined) {
          this.issueLog.push({
            message: 'An item was locked that should not exist in the queue.',
            data: nextItem
          });

          throw new Error('An item was locked that should not exist in the queue.');
        }

        this.lockHeapItem(heapItem);
      }

      return nextItem;
    } catch (ex: unknown) {
      this.issueLog.push({
        message: 'The queue crashed while enqueueing',
        data: ex
      });
      await this.crashHandler(this.getState());

      throw ex;
    }
  }

  public async renewLock ({ discriminator, token }: { discriminator: string; token: string }): Promise<void> {
    this.unlockExpiredLocks();

    try {
      this.actionLog.push({
        type: 'renewLock',
        data: { discriminator, token }
      });
      await this.queue.renewLock({ discriminator, token });
      const matchingLocks = [ ...this.lockedItems.entries() ].
        filter(([ , heapItem ]): boolean => heapItem.discriminator === discriminator);

      if (matchingLocks.length > 1) {
        this.issueLog.push({
          message: 'Multiple locks are present for a single discriminator.',
          data: { matchingLocks }
        });

        throw new Error('Multiple locks are present for a single discriminator.');
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
      this.issueLog.push({
        message: 'The queue crashed while renewing a lock.',
        data: ex
      });
      await this.crashHandler(this.getState());

      throw ex;
    }
  }

  public async acknowledge ({ discriminator, token }: { discriminator: string; token: string }): Promise<void> {
    this.unlockExpiredLocks();

    try {
      this.actionLog.push({
        type: 'acknowledge',
        data: { discriminator, token }
      });
      await this.queue.acknowledge({ discriminator, token });

      const matchingLocks = [ ...this.lockedItems.entries() ].
        filter(([ , heapItem ]): boolean => heapItem.discriminator === discriminator);

      if (matchingLocks.length > 1) {
        this.issueLog.push({
          message: 'Multiple locks are present for a single discriminator.',
          data: { matchingLocks }
        });
        throw new Error('Multiple locks are present for a single discriminator.');
      }
      this.lockedItems.forEach((heapItem, observableId): void => {
        if (heapItem.discriminator === discriminator) {
          this.lockedItems.delete(observableId);
          this.acknowledgedItems.set(observableId, heapItem);
        }
      });
    } catch (ex: unknown) {
      this.issueLog.push({
        message: 'The queue crashed while acknowledging an item.',
        data: ex
      });
      await this.crashHandler(this.getState());

      throw ex;
    }
  }

  public async defer ({ discriminator, token, priority }: { discriminator: string; token: string; priority: number }): Promise<void> {
    this.unlockExpiredLocks();

    try {
      this.actionLog.push({
        type: 'defer',
        data: { discriminator, token, priority }
      });
      await this.queue.defer({ discriminator, token, priority });

      const matchingLocks = [ ...this.lockedItems.entries() ].
        filter(([ , heapItem ]): boolean => heapItem.discriminator === discriminator);

      if (matchingLocks.length > 1) {
        this.issueLog.push({
          message: 'Multiple locks are present for a single discriminator.',
          data: { matchingLocks }
        });
        throw new Error('Multiple locks are present for a single discriminator.');
      }
      this.lockedItems.forEach((heapItem, observableId): void => {
        if (heapItem.discriminator === discriminator) {
          this.lockedItems.delete(observableId);
          this.enqueuedItems.set(observableId, heapItem);
        }
      });
    } catch (ex: unknown) {
      this.issueLog.push({
        message: 'The queue crashed while deferring an item.',
        data: ex
      });
      await this.crashHandler(this.getState());

      throw ex;
    }
  }

  public async remove ({ discriminator, itemIdentifier }: { discriminator: string; itemIdentifier: string }): Promise<void> {
    this.unlockExpiredLocks();

    try {
      this.actionLog.push({
        type: 'remove',
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
      this.issueLog.push({
        message: 'The queue crashed while removing an item.',
        data: ex
      });
      await this.crashHandler(this.getState());

      throw ex;
    }
  }

  public async setup (): Promise<void> {
    return this.queue.setup();
  }

  public static async create (
    { observedQueueOptions }: PriorityQueueObserverOptions,
    crashHandler: CrashHandler
  ): Promise<PriorityQueueObserver> {
    const actualOptions = {
      ...observedQueueOptions,
      expirationTime: observedQueueOptions.expirationTime ?? PriorityQueueObserver.defaultExpirationTime
    };
    const queue = await createPriorityQueueStore(actualOptions);

    return new PriorityQueueObserver(queue, actualOptions, crashHandler);
  }

  public async destroy (): Promise<void> {
    return this.queue.destroy();
  }

  public getActionLog (): Action[] {
    return this.actionLog;
  }

  public getIssueLog (): Issue[] {
    return this.issueLog;
  }
}

export type {
  Action,
  CrashHandler,
  HeapItem,
  Issue,
  Item,
  ObservableItem,
  ObserverState,
  PriorityQueueObserverOptions
};

export {
  PriorityQueueObserver
};

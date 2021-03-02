import { createPriorityQueueStore } from '../createPriorityQueueStore';
import { LockMetadata } from '../LockMetadata';
import { PassThrough } from 'stream';
import { PriorityQueueObserverOptions } from './PriorityQueueObserverOptions';
import { PriorityQueueStore } from '../PriorityQueueStore';
import { PriorityQueueStoreOptions } from '../PriorityQueueStoreOptions';
import { errors as wolkenkitErrors } from '../../../common/errors';
import { defekt, isCustomError } from 'defekt';

interface Issue {
  type: 'action' | 'issue' | 'error';
  message: string;
  data?: any;
}

const errors = defekt({
  ObserverError: {}
});

class PriorityQueueObserver<TItem extends object, TItemIdentifier extends object> implements PriorityQueueStore<TItem, TItemIdentifier> {
  protected queue: PriorityQueueStore<TItem, TItemIdentifier>;

  protected events: PassThrough;

  protected static readonly defaultExpirationTime = 15_000;

  protected queueOptions: PriorityQueueStoreOptions<TItem, TItemIdentifier>;

  protected constructor (
    queue: PriorityQueueStore<TItem, TItemIdentifier>,
    queueOptions: PriorityQueueStoreOptions<TItem, TItemIdentifier>
  ) {
    this.queue = queue;
    this.queueOptions = queueOptions;
    this.events = new PassThrough({ objectMode: true });
  }

  protected emitIssue (issue: Issue): void {
    this.events.push(issue);
  }

  public async enqueue ({ item, discriminator, priority }: {
    item: TItem;
    discriminator: string;
    priority: number;
  }): Promise<void> {
    this.emitIssue({
      type: 'action',
      message: 'enqueue',
      data: item
    });

    try {
      await this.queue.enqueue({ item, discriminator, priority });
    } catch (ex: unknown) {
      this.emitIssue({
        type: 'error',
        message: 'An error occured during enqueue.',
        data: ex
      });

      throw ex;
    }
  }

  public async lockNext (): Promise<{ item: TItem; metadata: LockMetadata } | undefined> {
    try {
      this.emitIssue({
        type: 'action',
        message: 'lockNext'
      });

      const nextItem = await this.queue.lockNext();

      if (nextItem === undefined) {
        this.emitIssue({
          type: 'issue',
          message: 'Couldn\'t lock next item.'
        });
      }

      return nextItem;
    } catch (ex: unknown) {
      this.emitIssue({
        type: 'error',
        message: 'An error occured during lockNext.',
        data: ex
      });

      throw ex;
    }
  }

  public async renewLock ({ discriminator, token }: { discriminator: string; token: string }): Promise<void> {
    try {
      this.emitIssue({
        type: 'action',
        message: 'renewLock',
        data: { discriminator, token }
      });

      await this.queue.renewLock({ discriminator, token });
    } catch (ex: unknown) {
      if (isCustomError(ex)) {
        switch (ex.code) {
          case wolkenkitErrors.TokenMismatch.code:
          case wolkenkitErrors.ItemNotFound.code:
          case wolkenkitErrors.ItemNotLocked.code: {
            this.emitIssue({
              type: 'issue',
              message: 'renewLock failed.',
              data: ex
            });

            throw ex;
          }
          default: {
            break;
          }
        }
      }

      this.emitIssue({
        type: 'error',
        message: 'An error occured during renewLock.',
        data: ex
      });

      throw ex;
    }
  }

  public async acknowledge ({ discriminator, token }: { discriminator: string; token: string }): Promise<void> {
    try {
      this.emitIssue({
        type: 'action',
        message: 'acknowledge',
        data: { discriminator, token }
      });

      await this.queue.acknowledge({ discriminator, token });
    } catch (ex: unknown) {
      if (isCustomError(ex)) {
        switch (ex.code) {
          case wolkenkitErrors.TokenMismatch.code:
          case wolkenkitErrors.ItemNotFound.code:
          case wolkenkitErrors.ItemNotLocked.code: {
            this.emitIssue({
              type: 'issue',
              message: 'acknowledge failed.',
              data: ex
            });

            throw ex;
          }
          default: {
            break;
          }
        }
      }

      this.emitIssue({
        type: 'error',
        message: 'An error occured during acknowledge.',
        data: ex
      });

      throw ex;
    }
  }

  public async defer ({ discriminator, token, priority }: { discriminator: string; token: string; priority: number }): Promise<void> {
    try {
      this.emitIssue({
        type: 'action',
        message: 'defer',
        data: { discriminator, token, priority }
      });

      await this.queue.defer({ discriminator, token, priority });
    } catch (ex: unknown) {
      if (isCustomError(ex)) {
        switch (ex.code) {
          case wolkenkitErrors.TokenMismatch.code:
          case wolkenkitErrors.ItemNotFound.code:
          case wolkenkitErrors.ItemNotLocked.code: {
            this.emitIssue({
              type: 'issue',
              message: 'defer failed.',
              data: ex
            });

            throw ex;
          }
          default: {
            break;
          }
        }
      }

      this.emitIssue({
        type: 'error',
        message: 'An error occured during defer.',
        data: ex
      });

      throw ex;
    }
  }

  public async remove ({ discriminator, itemIdentifier }: {
    discriminator: string;
    itemIdentifier: TItemIdentifier;
  }): Promise<void> {
    try {
      this.emitIssue({
        type: 'action',
        message: 'remove',
        data: { discriminator, itemIdentifier }
      });

      await this.queue.remove({ discriminator, itemIdentifier });
    } catch (ex: unknown) {
      if (isCustomError(ex)) {
        switch (ex.code) {
          case wolkenkitErrors.ItemNotFound.code: {
            this.emitIssue({
              type: 'issue',
              message: 'remove failed.',
              data: ex
            });

            throw ex;
          }
          default: {
            break;
          }
        }
      }

      this.emitIssue({
        type: 'error',
        message: 'An error occured during remove.',
        data: ex
      });

      throw ex;
    }
  }

  public async setup (): Promise<void> {
    return this.queue.setup();
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  public static async create<TItem extends object, TItemIdentifier extends object> (
    { observedQueueOptions }: PriorityQueueObserverOptions<TItem, TItemIdentifier>
  ): Promise<PriorityQueueObserver<TItem, TItemIdentifier>> {
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
  Issue,
  PriorityQueueObserverOptions
};

export {
  errors,
  PriorityQueueObserver
};

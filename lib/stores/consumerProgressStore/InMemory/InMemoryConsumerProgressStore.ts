import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { errors } from '../../../common/errors';
import { InMemoryConsumerProgressStoreOptions } from './InMemoryConsumerProgressStoreOptions';
import { IsReplaying } from '../IsReplaying';

class InMemoryConsumerProgressStore implements ConsumerProgressStore {
  protected progress: Record<string, Record<string, { revision: number; isReplaying: IsReplaying } | undefined> | undefined>;

  protected constructor () {
    this.progress = {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async create (_options: InMemoryConsumerProgressStoreOptions): Promise<InMemoryConsumerProgressStore> {
    return new InMemoryConsumerProgressStore();
  }

  public async getProgress ({ consumerId, aggregateIdentifier }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<{ revision: number; isReplaying: IsReplaying }> {
    return {
      revision: this.progress[consumerId]?.[aggregateIdentifier.id]?.revision ?? 0,
      isReplaying: this.progress[consumerId]?.[aggregateIdentifier.id]?.isReplaying ?? false
    };
  }

  public async setProgress ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }): Promise<void> {
    if (!this.progress[consumerId]) {
      this.progress[consumerId] = {};
    }
    if (!this.progress[consumerId]![aggregateIdentifier.id]) {
      this.progress[consumerId]![aggregateIdentifier.id] = { revision: 0, isReplaying: false };
    }

    if (revision <= this.progress[consumerId]![aggregateIdentifier.id]!.revision) {
      throw new errors.RevisionTooLow();
    }

    this.progress[consumerId]![aggregateIdentifier.id]!.revision = revision;
  }

  public async setIsReplaying ({ consumerId, aggregateIdentifier, isReplaying }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    isReplaying: IsReplaying;
  }): Promise<void> {
    if (!this.progress[consumerId]) {
      this.progress[consumerId] = {};
    }
    if (!this.progress[consumerId]![aggregateIdentifier.id]) {
      this.progress[consumerId]![aggregateIdentifier.id] = { revision: 0, isReplaying: false };
    }

    if (this.progress[consumerId]![aggregateIdentifier.id]!.isReplaying !== false) {
      throw new errors.FlowIsAlreadyReplaying();
    }

    this.progress[consumerId]![aggregateIdentifier.id]!.isReplaying = isReplaying;
  }

  public async resetProgress ({ consumerId }: {
    consumerId: string;
  }): Promise<void> {
    Reflect.deleteProperty(this.progress, consumerId);
  }

  public async destroy (): Promise<void> {
    this.progress = {};
  }
}

export { InMemoryConsumerProgressStore };

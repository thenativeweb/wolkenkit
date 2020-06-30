import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { errors } from '../../../common/errors';

class InMemoryConsumerProgressStore implements ConsumerProgressStore {
  protected progress: Record<string, Record<string, number | undefined> | undefined>;

  protected constructor () {
    this.progress = {};
  }

  public static async create (): Promise<InMemoryConsumerProgressStore> {
    return new InMemoryConsumerProgressStore();
  }

  public async getProgress ({ consumerId, aggregateIdentifier }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<number> {
    return this.progress[consumerId]?.[aggregateIdentifier.id] ?? 0;
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
      this.progress[consumerId]![aggregateIdentifier.id] = 0;
    }

    if (revision <= this.progress[consumerId]![aggregateIdentifier.id]!) {
      throw new errors.RevisionTooLow();
    }

    this.progress[consumerId]![aggregateIdentifier.id] = revision;
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

import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';

export interface ConsumerProgressStore {
  getProgress: ({ consumerId, aggregateIdentifier }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<number>;

  setProgress: ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }) => Promise<void>;

  resetProgress: ({ consumerId }: {
    consumerId: string;
  }) => Promise<void>;

  destroy: () => Promise<void>;
}

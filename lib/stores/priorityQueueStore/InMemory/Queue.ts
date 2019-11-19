import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';

export interface Queue<TItem> {
  aggregateIdentifier: AggregateIdentifier;
  lock?: {
    until: number;
    token: string;
  };
  items: TItem[];
}

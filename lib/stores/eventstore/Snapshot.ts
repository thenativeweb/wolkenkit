import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import { State } from '../../common/elements/State';

export interface Snapshot {
  aggregateIdentifier: AggregateIdentifier;
  revision: number;
  state: State;
}

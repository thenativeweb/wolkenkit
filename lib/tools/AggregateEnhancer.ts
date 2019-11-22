import { Aggregate } from '../common/elements/Aggregate';
import { State } from '../common/elements/State';

export type AggregateEnhancer = (aggregate: Aggregate<State>) => Aggregate<State>;

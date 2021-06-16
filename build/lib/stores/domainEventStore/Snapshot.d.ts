import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import { State } from '../../common/elements/State';
export interface Snapshot<TState extends State> {
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
    state: TState;
}

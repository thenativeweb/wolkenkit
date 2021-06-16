import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { State } from '../elements/State';
export interface AggregatesService {
    read: <TState extends State>(parameters: {
        aggregateIdentifier: AggregateIdentifier;
    }) => Promise<TState>;
}

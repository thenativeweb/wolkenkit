import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { State } from '../elements/State';

export interface AggregatesService {
  read: <TState extends State> (parameters: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<TState>;
}

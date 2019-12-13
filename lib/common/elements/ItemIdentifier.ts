import { AggregateIdentifier } from './AggregateIdentifier';
import { ContextIdentifier } from './ContextIdentifier';

export interface ItemIdentifier {
  contextIdentifier: ContextIdentifier;
  aggregateIdentifier: AggregateIdentifier;
  id: string;
  name: string;
}

import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import { ContextIdentifier } from '../../common/elements/ContextIdentifier';

export interface ItemIdentifier {
  contextIdentifier: ContextIdentifier;
  aggregateIdentifier: AggregateIdentifier;
  id: string;
  name: string;
}

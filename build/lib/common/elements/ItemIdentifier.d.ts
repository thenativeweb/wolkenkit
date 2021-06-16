import { AggregateIdentifier } from './AggregateIdentifier';
export interface ItemIdentifier {
    aggregateIdentifier: AggregateIdentifier;
    id: string;
    name: string;
}

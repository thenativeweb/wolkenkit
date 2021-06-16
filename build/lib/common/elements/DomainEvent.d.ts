import { AggregateIdentifier } from './AggregateIdentifier';
import { DomainEventData } from './DomainEventData';
import { DomainEventMetadata } from './DomainEventMetadata';
import { ItemIdentifier } from './ItemIdentifier';
declare class DomainEvent<TDomainEventData extends DomainEventData> {
    readonly aggregateIdentifier: AggregateIdentifier;
    readonly name: string;
    readonly data: TDomainEventData;
    readonly id: string;
    readonly metadata: DomainEventMetadata;
    constructor({ aggregateIdentifier, name, data, id, metadata }: {
        aggregateIdentifier: AggregateIdentifier;
        name: string;
        data: TDomainEventData;
        id: string;
        metadata: DomainEventMetadata;
    });
    getItemIdentifier(): ItemIdentifier;
    getFullyQualifiedName(): string;
}
export { DomainEvent };

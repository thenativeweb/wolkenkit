import { AggregateIdentifier } from './AggregateIdentifier';
import { DomainEventData } from './DomainEventData';
import { DomainEventMetadata } from './DomainEventMetadata';
import { ItemIdentifier } from './ItemIdentifier';

class DomainEvent<TDomainEventData extends DomainEventData> {
  public readonly aggregateIdentifier: AggregateIdentifier;

  public readonly name: string;

  public readonly data: TDomainEventData;

  public readonly id: string;

  public readonly metadata: DomainEventMetadata;

  public constructor ({
    aggregateIdentifier,
    name,
    data,
    id,
    metadata
  }: {
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TDomainEventData;
    id: string;
    metadata: DomainEventMetadata;
  }) {
    this.aggregateIdentifier = aggregateIdentifier;
    this.name = name;
    this.data = data;
    this.id = id;
    this.metadata = metadata;
  }

  public getItemIdentifier (): ItemIdentifier {
    return {
      aggregateIdentifier: this.aggregateIdentifier,
      name: this.name,
      id: this.id
    };
  }

  public getFullyQualifiedName (): string {
    return `${this.aggregateIdentifier.context.name}.${this.aggregateIdentifier.aggregate.name}.${this.name}`;
  }
}

export { DomainEvent };

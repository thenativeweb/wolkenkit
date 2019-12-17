import { AggregateIdentifier } from './AggregateIdentifier';
import { ContextIdentifier } from './ContextIdentifier';
import { DomainEventData } from './DomainEventData';
import { DomainEventMetadata } from './DomainEventMetadata';
import { ItemIdentifier } from './ItemIdentifier';

class DomainEvent<TDomainEventData extends DomainEventData> {
  public readonly contextIdentifier: ContextIdentifier;

  public readonly aggregateIdentifier: AggregateIdentifier;

  public readonly name: string;

  public readonly data: TDomainEventData;

  public readonly id: string;

  public readonly metadata: DomainEventMetadata;

  public readonly tags: string[];

  public constructor ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    data,
    id,
    metadata,
    tags
  }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TDomainEventData;
    id: string;
    metadata: DomainEventMetadata;
    tags: string[];
  }) {
    this.contextIdentifier = contextIdentifier;
    this.aggregateIdentifier = aggregateIdentifier;
    this.name = name;
    this.data = data;
    this.id = id;
    this.metadata = metadata;
    this.tags = tags;
  }

  public withRevisionGlobal ({ revisionGlobal }: {
    revisionGlobal: number;
  }): DomainEvent<TDomainEventData> {
    return new DomainEvent({
      contextIdentifier: this.contextIdentifier,
      aggregateIdentifier: this.aggregateIdentifier,
      name: this.name,
      data: this.data,
      id: this.id,
      metadata: {
        ...this.metadata,
        revision: {
          ...this.metadata.revision,
          global: revisionGlobal
        }
      },
      tags: this.tags
    });
  }

  public asPublished (): DomainEvent<TDomainEventData> {
    return new DomainEvent({
      contextIdentifier: this.contextIdentifier,
      aggregateIdentifier: this.aggregateIdentifier,
      name: this.name,
      data: this.data,
      id: this.id,
      metadata: {
        ...this.metadata,
        isPublished: true
      },
      tags: this.tags
    });
  }

  public getItemIdentifier (): ItemIdentifier {
    return {
      contextIdentifier: this.contextIdentifier,
      aggregateIdentifier: this.aggregateIdentifier,
      name: this.name,
      id: this.id
    };
  }
}

export { DomainEvent };

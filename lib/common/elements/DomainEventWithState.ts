import { AggregateIdentifier } from './AggregateIdentifier';
import { ContextIdentifier } from './ContextIdentifier';
import { DomainEvent } from './DomainEvent';
import { DomainEventData } from './DomainEventData';
import { DomainEventMetadata } from './DomainEventMetadata';

class DomainEventWithState<TDomainEventData extends DomainEventData, TState> extends DomainEvent<TDomainEventData> {
  public readonly state: {
    previous: TState;
    next: TState;
  };

  public constructor ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    data,
    id,
    metadata,
    tags,
    state
  }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TDomainEventData;
    id: string;
    metadata: DomainEventMetadata;
    tags: string[];
    state: {
      previous: TState;
      next: TState;
    };
  }) {
    super({
      contextIdentifier,
      aggregateIdentifier,
      name,
      data,
      id,
      metadata,
      tags
    });

    this.state = state;
  }

  public withRevisionGlobal ({ revisionGlobal }: {
    revisionGlobal: number;
  }): DomainEventWithState<TDomainEventData, TState> {
    return new DomainEventWithState({
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
      tags: this.tags,
      state: this.state
    });
  }

  public asPublished (): DomainEventWithState<TDomainEventData, TState> {
    return new DomainEventWithState({
      contextIdentifier: this.contextIdentifier,
      aggregateIdentifier: this.aggregateIdentifier,
      name: this.name,
      data: this.data,
      id: this.id,
      metadata: {
        ...this.metadata,
        isPublished: true
      },
      tags: this.tags,
      state: this.state
    });
  }

  public withoutState (): DomainEvent<TDomainEventData> {
    return new DomainEvent(this);
  }
}

export { DomainEventWithState };

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
    state
  }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TDomainEventData;
    id: string;
    metadata: DomainEventMetadata;
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
      metadata
    });

    this.state = state;
  }

  public withoutState (): DomainEvent<TDomainEventData> {
    return new DomainEvent(this);
  }
}

export { DomainEventWithState };

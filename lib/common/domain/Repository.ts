import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { CurrentAggregateState } from './CurrentAggregateState';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventStore } from '../../stores/domainEventStore/DomainEventStore';
import { errors } from '../errors';
import { State } from '../elements/State';

class Repository {
  protected applicationDefinition: ApplicationDefinition;

  protected domainEventStore: DomainEventStore;

  public constructor ({ applicationDefinition, domainEventStore }: {
    applicationDefinition: ApplicationDefinition;
    domainEventStore: DomainEventStore;
  }) {
    this.applicationDefinition = applicationDefinition;
    this.domainEventStore = domainEventStore;
  }

  public async loadCurrentAggregateState <TState extends State> ({ contextIdentifier, aggregateIdentifier }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<CurrentAggregateState<TState>> {
    if (!(contextIdentifier.name in this.applicationDefinition.domain)) {
      throw new errors.ContextNotFound();
    }

    const contextDefinition = this.applicationDefinition.domain[contextIdentifier.name];

    if (!(aggregateIdentifier.name in contextDefinition)) {
      throw new errors.AggregateNotFound();
    }

    const initialState = contextDefinition[aggregateIdentifier.name].getInitialState() as TState;

    const currentAggregateState = new CurrentAggregateState<TState>({
      contextIdentifier,
      aggregateIdentifier,
      initialState
    });

    const snapshot = await this.domainEventStore.getSnapshot<TState>({
      aggregateIdentifier: currentAggregateState.aggregateIdentifier
    });

    let fromRevision = 1;

    if (snapshot) {
      currentAggregateState.applySnapshot({ snapshot });
      fromRevision = snapshot.revision + 1;
    }

    const domainEventStream = await this.domainEventStore.getDomainEventStream({
      aggregateIdentifier: currentAggregateState.aggregateIdentifier,
      fromRevision
    });

    await currentAggregateState.applyDomainEventStream({
      applicationDefinition: this.applicationDefinition,
      domainEventStream
    });

    return currentAggregateState;
  }

  public async saveCurrentAggregateState ({ currentAggregateState }: {
    currentAggregateState: CurrentAggregateState<State>;
  }): Promise<DomainEvent<DomainEventData>[]> {
    if (currentAggregateState.unsavedDomainEvents.length === 0) {
      return [];
    }

    const savedDomainEvents = await this.domainEventStore.saveDomainEvents({
      domainEvents: currentAggregateState.unsavedDomainEvents
    });

    return savedDomainEvents;
  }
}

export { Repository };

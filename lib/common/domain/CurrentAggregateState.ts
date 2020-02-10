import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../../../lib/common/elements/DomainEventHandler';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from '../errors';
import { get } from 'lodash';
import { getLoggerService } from '../services/getLoggerService';
import { Snapshot } from '../../stores/domainEventStore/Snapshot';
import { State } from '../elements/State';

class CurrentAggregateState<TState extends State> {
  public readonly contextIdentifier: ContextIdentifier;

  public readonly aggregateIdentifier: AggregateIdentifier;

  public state: TState;

  public revision: number;

  public unsavedDomainEvents: DomainEventWithState<DomainEventData, TState>[];

  public constructor ({ contextIdentifier, aggregateIdentifier, initialState }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    initialState: TState;
  }) {
    this.contextIdentifier = contextIdentifier;
    this.aggregateIdentifier = aggregateIdentifier;

    this.state = initialState;
    this.revision = 0;
    this.unsavedDomainEvents = [];
  }

  public exists (): boolean {
    return this.revision > 0;
  }

  public applySnapshot ({ snapshot }: {
    snapshot: Snapshot<TState>;
  }): void {
    if (this.aggregateIdentifier.id !== snapshot.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch('Failed to apply snapshot. Aggregate id does not match.');
    }

    this.state = snapshot.state;
    this.revision = snapshot.revision;
  }

  public applyDomainEvent <TDomainEventData extends DomainEventData> ({ applicationDefinition, domainEvent }: {
    applicationDefinition: ApplicationDefinition;
    domainEvent: DomainEvent<TDomainEventData>;
  }): TState {
    if (domainEvent.contextIdentifier.name !== this.contextIdentifier.name) {
      throw new errors.IdentifierMismatch('Context name does not match.');
    }
    if (domainEvent.aggregateIdentifier.name !== this.aggregateIdentifier.name) {
      throw new errors.IdentifierMismatch('Aggregate name does not match.');
    }
    if (domainEvent.aggregateIdentifier.id !== this.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch('Aggregate id does not match.');
    }

    const domainEventHandler = get(applicationDefinition.domain, [ this.contextIdentifier.name, this.aggregateIdentifier.name, 'domainEventHandlers', domainEvent.name ]) as DomainEventHandler<State, DomainEventData> | undefined;

    if (!domainEventHandler) {
      throw new errors.DomainEventUnknown(`Failed to apply unknown domain event '${domainEvent.name}' in '${this.contextIdentifier.name}.${this.aggregateIdentifier.name}'.`);
    }

    const services = {
      logger: getLoggerService({
        fileName: `<app>/server/domain/${domainEvent.contextIdentifier.name}/${domainEvent.aggregateIdentifier.name}/`,
        packageManifest: applicationDefinition.packageManifest
      })
    };

    const newStatePartial = domainEventHandler.handle(this.state, domainEvent, services);

    return {
      ...this.state,
      ...newStatePartial
    };
  }
}

export { CurrentAggregateState };

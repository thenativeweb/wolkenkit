import { AskInfrastructure } from '../../elements/AskInfrastructure';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventHandler } from '../../elements/DomainEventHandler';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { Services } from './Services';
import { State } from '../../elements/State';
import { TellInfrastructure } from '../../elements/TellInfrastructure';
declare const mapDomainEvent: ({ domainEventWithState, aggregateState, domainEventHandler, services }: {
    domainEventWithState: DomainEventWithState<DomainEventData, State>;
    aggregateState: State;
    domainEventHandler: DomainEventHandler<State, DomainEventData, AskInfrastructure & TellInfrastructure>;
    services: Services;
}) => Promise<DomainEventWithState<DomainEventData, State>>;
export { mapDomainEvent };

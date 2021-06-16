import { Application } from '../application/Application';
import { DomainEventWithState } from '../elements/DomainEventWithState';
declare const validateDomainEventWithState: <TDomainEventData extends object, TState>({ domainEvent, application }: {
    domainEvent: DomainEventWithState<TDomainEventData, TState>;
    application: Application;
}) => void;
export { validateDomainEventWithState };

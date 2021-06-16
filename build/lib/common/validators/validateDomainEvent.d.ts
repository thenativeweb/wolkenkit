import { Application } from '../application/Application';
import { DomainEvent } from '../elements/DomainEvent';
declare const validateDomainEvent: <TDomainEventData extends object>({ domainEvent, application }: {
    domainEvent: DomainEvent<TDomainEventData>;
    application: Application;
}) => void;
export { validateDomainEvent };

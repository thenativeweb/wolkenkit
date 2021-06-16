import { Application } from '../../application/Application';
import { DomainEvent } from '../../elements/DomainEvent';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { Repository } from '../Repository';
import { Services } from './Services';
import { State } from '../../elements/State';
declare const prepareForPublication: ({ domainEventWithState, domainEventFilter, application, repository, services }: {
    domainEventWithState: DomainEventWithState<DomainEventData, State>;
    domainEventFilter: Record<string, unknown>;
    application: Application;
    repository: Repository;
    services: Services;
}) => Promise<DomainEvent<DomainEventData> | undefined>;
export { prepareForPublication };

import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { State } from '../elements/State';
export declare type PublishDomainEvents = ({ domainEvents }: {
    domainEvents: DomainEventWithState<DomainEventData, State>[];
}) => Promise<void>;

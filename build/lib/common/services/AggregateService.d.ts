import { DomainEventData } from '../elements/DomainEventData';
import { State } from '../elements/State';
export interface AggregateService<TState extends State> {
    id: () => string;
    isPristine: () => boolean;
    publishDomainEvent: <TDomainEventData extends DomainEventData>(domainEventName: string, domainEventData: TDomainEventData) => TState;
}

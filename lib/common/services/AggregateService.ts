import { DomainEventData } from '../elements/DomainEventData';
import { State } from '../elements/State';

export interface AggregateService<TState extends State> {
  id (): string;

  exists (): boolean;

  publishDomainEvent <TDomainEventData extends DomainEventData> (domainEventName: string, domainEventData: TDomainEventData): TState;
}

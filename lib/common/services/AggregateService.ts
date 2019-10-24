import { DomainEventData } from '../elements/DomainEventData';

export interface AggregateService {
  id (): string;

  exists (): boolean;

  publishDomainEvent <TDomainEventData extends DomainEventData> (eventName: string, data: TDomainEventData): void;
}

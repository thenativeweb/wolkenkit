import DomainEvent from './DomainEvent';
import { DomainEventData } from './DomainEventData';

export interface ProjectionHandler<TDatabaseView, TDomainEventData extends DomainEventData> {
  selector: string;

  handle (databaseView: TDatabaseView, event: DomainEvent<TDomainEventData>): void | Promise<void>;
}

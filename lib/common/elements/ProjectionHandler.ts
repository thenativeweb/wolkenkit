import { AggregatesService } from '../services/AggregatesService';
import { DomainEvent } from './DomainEvent';
import { DomainEventData } from './DomainEventData';
import { LoggerService } from '../services/LoggerService';

export interface ProjectionHandler<TDatabaseView, TDomainEventData extends DomainEventData> {
  selector: string;

  handle (databaseView: TDatabaseView, event: DomainEvent<TDomainEventData>, services: {
    aggregates: AggregatesService;
    logger: LoggerService;
  }): void | Promise<void>;
}

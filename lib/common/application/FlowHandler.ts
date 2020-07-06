import { AggregatesService } from '../services/AggregatesService';
import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandService } from '../services/CommandService';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { ItemIdentifier } from '../elements/ItemIdentifier';
import { LockService } from '../services/LockService';
import { LoggerService } from '../services/LoggerService';
import { TellInfrastructure } from '../elements/TellInfrastructure';

export interface FlowHandler<
  TDomainEventData extends DomainEventData,
  TInfrastructure extends AskInfrastructure & TellInfrastructure
> {
  isRelevant (domainEvent: {
    fullyQualifiedName: string;
    itemIdentifier: ItemIdentifier;
  }): boolean;

  handle (domainEvent: DomainEvent<TDomainEventData>, services: {
    aggregates: AggregatesService;
    command: CommandService;
    infrastructure: TInfrastructure;
    lock: LockService;
    logger: LoggerService;
  }): void | Promise<void>;
}

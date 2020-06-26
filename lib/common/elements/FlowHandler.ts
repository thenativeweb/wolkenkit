import { AskInfrastructure } from './AskInfrastructure';
import { DomainEvent } from './DomainEvent';
import { DomainEventData } from './DomainEventData';
import { ItemIdentifier } from './ItemIdentifier';
import { LockService } from '../services/LockService';
import { LoggerService } from '../services/LoggerService';
import { TellInfrastructure } from './TellInfrastructure';

export interface FlowHandler<
  TDomainEventData extends DomainEventData,
  TInfrastructure extends AskInfrastructure & TellInfrastructure
> {
  isRelevant (domainEvent: {
    fullyQualifiedName: string;
    itemIdentifier: ItemIdentifier;
  }): boolean;

  handle (domainEvent: DomainEvent<TDomainEventData>, services: {
    lock: LockService;
    logger: LoggerService;
    infrastructure: TInfrastructure;
  }): void | Promise<void>;
}

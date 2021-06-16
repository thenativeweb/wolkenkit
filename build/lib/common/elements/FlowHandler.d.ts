import { AggregatesService } from '../services/AggregatesService';
import { AskInfrastructure } from './AskInfrastructure';
import { CommandService } from '../services/CommandService';
import { DomainEvent } from './DomainEvent';
import { DomainEventData } from './DomainEventData';
import { ItemIdentifier } from './ItemIdentifier';
import { LockService } from '../services/LockService';
import { LoggerService } from '../services/LoggerService';
import { NotificationService } from '../services/NotificationService';
import { TellInfrastructure } from './TellInfrastructure';
export interface FlowHandler<TDomainEventData extends DomainEventData, TInfrastructure extends AskInfrastructure & TellInfrastructure> {
    isRelevant: (domainEvent: {
        fullyQualifiedName: string;
        itemIdentifier: ItemIdentifier;
    }) => boolean;
    handle: (domainEvent: DomainEvent<TDomainEventData>, services: {
        aggregates: AggregatesService;
        command: CommandService;
        infrastructure: TInfrastructure;
        lock: LockService;
        logger: LoggerService;
        notification: NotificationService;
    }) => void | Promise<void>;
}

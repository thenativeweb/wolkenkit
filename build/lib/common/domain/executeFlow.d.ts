import { AggregatesService } from '../services/AggregatesService';
import { Application } from '../application/Application';
import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandService } from '../services/CommandService';
import { ConsumerProgressStore } from '../../stores/consumerProgressStore/ConsumerProgressStore';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { LockService } from '../services/LockService';
import { LoggerService } from '../services/LoggerService';
import { NotificationService } from '../services/NotificationService';
import { PerformReplay } from './PerformReplay';
import { TellInfrastructure } from '../elements/TellInfrastructure';
declare const logger: import("flaschenpost/build/lib/Logger").Logger;
declare const executeFlow: <TInfrastructure extends AskInfrastructure & TellInfrastructure>({ application, flowName, domainEvent, flowProgressStore, services, performReplay }: {
    application: Application;
    flowName: string;
    domainEvent: DomainEvent<DomainEventData>;
    flowProgressStore: ConsumerProgressStore;
    services: {
        aggregates: AggregatesService;
        command: CommandService;
        infrastructure: TInfrastructure;
        logger: LoggerService;
        lock: LockService;
        notification: NotificationService;
    };
    performReplay: PerformReplay;
}) => Promise<'acknowledge' | 'defer'>;
export { executeFlow };

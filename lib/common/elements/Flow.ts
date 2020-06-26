import { AskInfrastructure } from './AskInfrastructure';
import { DomainEventData } from './DomainEventData';
import { FlowHandler } from './FlowHandler';
import { TellInfrastructure } from './TellInfrastructure';

export interface Flow {
  domainEventHandlers: Record<string, FlowHandler<DomainEventData, AskInfrastructure & TellInfrastructure>>;
}

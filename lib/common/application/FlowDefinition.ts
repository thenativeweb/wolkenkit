import { AskInfrastructure } from '../elements/AskInfrastructure';
import { DomainEventData } from '../elements/DomainEventData';
import { FlowHandler } from '../elements/FlowHandler';
import { TellInfrastructure } from '../elements/TellInfrastructure';

export interface FlowDefinition {
  replayPolicy: 'never' | 'on-demand' | 'always';

  domainEventHandlers: Record<string, FlowHandler<DomainEventData, AskInfrastructure & TellInfrastructure>>;
}

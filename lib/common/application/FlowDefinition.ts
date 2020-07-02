import { AskInfrastructure } from '../elements/AskInfrastructure';
import { DomainEventData } from '../elements/DomainEventData';
import { FlowEnhancer } from '../../tools/FlowEnhancer';
import { FlowHandler } from './FlowHandler';
import { TellInfrastructure } from '../elements/TellInfrastructure';

export interface FlowDefinition {
  replayPolicy: 'never' | 'on-demand' | 'always';

  domainEventHandlers: Record<string, FlowHandler<DomainEventData, AskInfrastructure & TellInfrastructure>>;

  enhancers?: FlowEnhancer[];
}

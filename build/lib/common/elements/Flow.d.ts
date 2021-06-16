import { AskInfrastructure } from './AskInfrastructure';
import { DomainEventData } from './DomainEventData';
import { FlowDefinition } from '../application/FlowDefinition';
import { FlowEnhancer } from '../../tools/FlowEnhancer';
import { TellInfrastructure } from './TellInfrastructure';
interface Flow<TInfrastructure extends AskInfrastructure & TellInfrastructure, TDomainEventDatas extends Record<string, DomainEventData> = Record<string, any>> extends FlowDefinition<TInfrastructure, TDomainEventDatas> {
    enhancers?: FlowEnhancer[];
}
export type { Flow };

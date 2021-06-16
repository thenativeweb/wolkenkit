import { AskInfrastructure } from '../elements/AskInfrastructure';
import { DomainEventData } from '../elements/DomainEventData';
import { FlowHandler } from '../elements/FlowHandler';
import { TellInfrastructure } from '../elements/TellInfrastructure';
export interface FlowDefinition<TInfrastructure extends AskInfrastructure & TellInfrastructure = AskInfrastructure & TellInfrastructure, TDomainEventDatas extends Record<string, DomainEventData> = Record<string, any>> {
    replayPolicy: 'never' | 'on-demand' | 'always';
    domainEventHandlers: {
        [domainEventName in keyof TDomainEventDatas]: FlowHandler<TDomainEventDatas[domainEventName], TInfrastructure>;
    };
}

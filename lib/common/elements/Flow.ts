import { AskInfrastructure } from './AskInfrastructure';
import { DomainEventData } from './DomainEventData';
import { FlowEnhancer } from '../../tools/FlowEnhancer';
import { FlowHandler } from './FlowHandler';
import { TellInfrastructure } from './TellInfrastructure';

export interface Flow<
  TInfrastructure extends AskInfrastructure & TellInfrastructure,
  TDomainEventDatas extends Record<string, DomainEventData> = Record<string, any>
> {
  replayPolicy: 'never' | 'on-demand' | 'always';

  domainEventHandlers: {
    [domainEventName in keyof TDomainEventDatas]: FlowHandler<
    TDomainEventDatas[domainEventName],
    TInfrastructure
    >
  };

  enhancers?: FlowEnhancer[];
}

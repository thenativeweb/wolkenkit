import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandData } from '../elements/CommandData';
import { CommandHandler } from '../elements/CommandHandler';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import { GetInitialState } from '../elements/GetInitialState';
import { State } from '../elements/State';
import { TellInfrastructure } from '../elements/TellInfrastructure';
export interface AggregateDefinition<TState extends State = State, TInfrastructure extends AskInfrastructure & TellInfrastructure = AskInfrastructure & TellInfrastructure, TCommandDatas extends Record<string, CommandData> = Record<string, any>, TDomainEventDatas extends Record<string, DomainEventData> = Record<string, any>> {
    getInitialState: GetInitialState<TState>;
    commandHandlers: {
        [commandName in keyof TCommandDatas]: CommandHandler<TState, TCommandDatas[commandName], TInfrastructure>;
    };
    domainEventHandlers: {
        [domainEventName in keyof TDomainEventDatas]: DomainEventHandler<TState, TDomainEventDatas[domainEventName], TInfrastructure>;
    };
}

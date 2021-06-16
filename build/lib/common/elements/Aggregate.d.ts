import { AggregateDefinition } from '../application/AggregateDefinition';
import { AggregateEnhancer } from '../../tools/AggregateEnhancer';
import { AskInfrastructure } from './AskInfrastructure';
import { CommandData } from './CommandData';
import { DomainEventData } from './DomainEventData';
import { State } from './State';
import { TellInfrastructure } from './TellInfrastructure';
interface Aggregate<TState extends State, TInfrastructure extends AskInfrastructure & TellInfrastructure, TCommandDatas extends Record<string, CommandData> = Record<string, any>, TDomainEventDatas extends Record<string, DomainEventData> = Record<string, any>> extends AggregateDefinition<TState, TInfrastructure, TCommandDatas, TDomainEventDatas> {
    enhancers?: AggregateEnhancer[];
}
export type { Aggregate };

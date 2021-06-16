import { Aggregate } from '../common/elements/Aggregate';
import { AskInfrastructure } from '../common/elements/AskInfrastructure';
import { State } from '../common/elements/State';
import { TellInfrastructure } from '../common/elements/TellInfrastructure';
export declare type AggregateEnhancer = (aggregate: Aggregate<State, AskInfrastructure & TellInfrastructure>) => Aggregate<State, AskInfrastructure & TellInfrastructure>;

import { AggregateInstance } from '../../domain/AggregateInstance';
import { AggregateService } from '../AggregateService';
import { Application } from '../../application/Application';
import { CommandWithMetadata } from '../../elements/CommandWithMetadata';
import { State } from '../../elements/State';
export declare type GetAggregateService = <TState extends State>(parameters: {
    aggregateInstance: AggregateInstance<TState>;
    application: Application;
    command: CommandWithMetadata<any>;
}) => AggregateService<TState>;

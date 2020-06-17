import { AggregateInstance } from '../../domain/AggregateInstance';
import { AggregateService } from '../AggregateService';
import { ApplicationDefinition } from '../../application/ApplicationDefinition';
import { CommandWithMetadata } from '../../elements/CommandWithMetadata';
import { State } from '../../elements/State';

export type GetAggregateService = <TState extends State>(parameters: {
  aggregateInstance: AggregateInstance<TState>;
  applicationDefinition: ApplicationDefinition;
  command: CommandWithMetadata<any>;
}) => AggregateService<TState>;

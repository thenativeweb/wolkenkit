import { CommandData } from '../../../elements/CommandData';
import { CommandForAggregateSandbox } from './CommandForAggregateSandbox';
import { DomainEvent } from '../../../elements/DomainEvent';
import { DomainEventData } from '../../../elements/DomainEventData';
import { DomainEventForAggregateSandbox } from './DomainEventForAggregateSandbox';
import { State } from '../../../elements/State';
export interface SandboxForAggregate<TState extends State> {
    given: <TDomainEventData extends DomainEventData>(domainEvent: DomainEventForAggregateSandbox<TDomainEventData>) => SandboxForAggregate<TState>;
    and: <TDomainEventData extends DomainEventData>(domainEvent: DomainEventForAggregateSandbox<TDomainEventData>) => SandboxForAggregate<TState>;
    when: <TCommandData extends CommandData>(parameters: CommandForAggregateSandbox<TCommandData>) => SandboxForAggregateWithResult<TState>;
}
export interface SandboxForAggregateWithResult<TState extends State> {
    and: <TCommandData extends CommandData>(parameters: CommandForAggregateSandbox<TCommandData>) => SandboxForAggregateWithResult<TState>;
    then: (callback: ((parameters: {
        state: State;
        domainEvents: DomainEvent<DomainEventData>[];
    }) => void | Promise<void>)) => Promise<void>;
}

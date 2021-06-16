import { Command } from '../../../elements/Command';
import { CommandData } from '../../../elements/CommandData';
import { DomainEventData } from '../../../elements/DomainEventData';
import { DomainEventForFlowSandbox } from './DomainEventForFlowSandbox';
export interface SandboxForFlow {
    when: <TDomainEventData extends DomainEventData>(domainEvent: DomainEventForFlowSandbox<TDomainEventData>) => SandboxForFlowWithResult;
}
export interface SandboxForFlowWithResult {
    and: <TDomainEventData extends DomainEventData>(domainEvent: DomainEventForFlowSandbox<TDomainEventData>) => SandboxForFlowWithResult;
    then: (callback: ((parameters: {
        commands: Command<CommandData>[];
    }) => void | Promise<void>)) => Promise<void>;
}

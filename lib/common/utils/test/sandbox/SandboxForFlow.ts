import { Command } from '../../../elements/Command';
import { CommandData } from '../../../elements/CommandData';
import { DomainEventData } from '../../../elements/DomainEventData';
import { Initiator } from '../../../elements/Initiator';

export interface SandboxForFlow {
  given <TDomainEventData extends DomainEventData>(parameters: {
    contextIdentifier: { name: string };
    aggregateIdentifier: { name: string; id: string };
    name: string;
    data: TDomainEventData;
    id?: string;
    metadata?: {
      causationId?: string;
      correlationId?: string;
      timestamp?: number;
      initiator?: Initiator;
      tags?: string[];
    };
  }): SandboxForFlow;

  and <TDomainEventData extends DomainEventData>(parameters: {
    contextIdentifier: { name: string };
    aggregateIdentifier: { name: string; id: string };
    name: string;
    data: TDomainEventData;
    id?: string;
    metadata?: {
      causationId?: string;
      correlationId?: string;
      timestamp?: number;
      initiator?: Initiator;
      tags?: string[];
    };
  }): SandboxForFlow;

  when <TDomainEventData extends DomainEventData>(parameters: {
    contextIdentifier: { name: string };
    aggregateIdentifier: { name: string; id: string };
    name: string;
    data: TDomainEventData;
    id?: string;
    metadata?: {
      causationId?: string;
      correlationId?: string;
      timestamp?: number;
      initiator?: Initiator;
      tags?: string[];
    };
  }): SandboxForFlowWithResult;
}

export interface SandboxForFlowWithResult {
  then(callback: ((parameters: {
    commands: Command<CommandData>[];
  }) => void | Promise<void>)): Promise<void>;
}

import { Command } from '../../../elements/Command';
import { CommandData } from '../../../elements/CommandData';
import { DomainEventData } from '../../../elements/DomainEventData';
import { Initiator } from '../../../elements/Initiator';
import {Notification} from "../../../elements/Notification";

export interface SandboxForFlow {
  when <TDomainEventData extends DomainEventData>(parameters: {
    contextIdentifier: { name: string };
    aggregateIdentifier: { name: string; id: string };
    name: string;
    data: TDomainEventData;
    id?: string;
    metadata: {
      causationId?: string;
      correlationId?: string;
      timestamp?: number;
      initiator?: Initiator;
      tags?: string[];
      revision: number;
    };
  }): SandboxForFlowWithResult;
}

export interface SandboxForFlowWithResult {
  and <TDomainEventData extends DomainEventData>(parameters: {
    contextIdentifier: { name: string };
    aggregateIdentifier: { name: string; id: string };
    name: string;
    data: TDomainEventData;
    id?: string;
    metadata: {
      causationId?: string;
      correlationId?: string;
      timestamp?: number;
      initiator?: Initiator;
      tags?: string[];
      revision: number;
    };
  }): SandboxForFlowWithResult;

  then(callback: ((parameters: {
    commands: Command<CommandData>[];
  }) => void | Promise<void>)): Promise<void>;
}

import { Client } from '../../../elements/Client';
import { CommandData } from '../../../elements/CommandData';
import { DomainEvent } from '../../../elements/DomainEvent';
import { DomainEventData } from '../../../elements/DomainEventData';
import { Initiator } from '../../../elements/Initiator';
import { State } from '../../../elements/State';

export interface SandboxForAggregate<TState extends State> {
  given <TDomainEventData extends DomainEventData>({ name, data, id, metadata }: {
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
  }): SandboxForAggregate<TState>;

  and <TDomainEventData extends DomainEventData>({ name, data, id, metadata }: {
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
  }): SandboxForAggregate<TState>;

  when <TCommandData extends CommandData>({ name, data, id, metadata }: {
    name: string;
    data: TCommandData;
    id?: string;
    metadata?: {
      causationId?: string;
      correlationId?: string;
      timestamp?: number;
      client?: Client;
      initiator?: Initiator;
    };
  }): SandboxForAggregateWithResult<TState>;
}

export interface SandboxForAggregateWithResult<TState extends State> {
  and<TCommandData extends CommandData>({ name, data, id, metadata }: {
    name: string;
    data: TCommandData;
    id?: string;
    metadata?: {
      causationId?: string;
      correlationId?: string;
      timestamp?: number;
      client?: Client;
      initiator?: Initiator;
    };
  }): SandboxForAggregateWithResult<TState>;

  then(callback: ((parameters: {
    state: State;
    domainEvents: DomainEvent<DomainEventData>[];
  }) => void | Promise<void>)): Promise<void>;
}

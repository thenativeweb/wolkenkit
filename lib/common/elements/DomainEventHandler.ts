import DomainEvent from './DomainEvent';
import { DomainEventData } from './DomainEventData';
import { Schema } from './Schema';
import { State } from './State';
import { Todo } from '../../types/Todo';

export interface DomainEventHandler<TState extends State, TDomainEventData extends DomainEventData> {
  getDocumentation? (): string;

  getSchema? (): Schema;

  handle (state: TState, event: DomainEvent<TDomainEventData>, service: Todo): Partial<TState>;

  isAuthorized (state: TState, event: DomainEvent<TDomainEventData>, service: Todo): boolean | Promise<boolean>;

  filter? (state: TState, event: DomainEvent<TDomainEventData>, service: Todo): boolean | Promise<boolean>;

  map? (state: TState, event: DomainEvent<TDomainEventData>, service: Todo): DomainEvent<TDomainEventData> | Promise<DomainEvent<TDomainEventData>>;
}

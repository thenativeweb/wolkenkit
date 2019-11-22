import { CommandData } from '../elements/CommandData';
import { CommandHandler } from '../../../lib/common/elements/CommandHandler';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../../../lib/common/elements/DomainEventHandler';
import { GetInitialState } from '../elements/GetInitialState';
import { State } from '../elements/State';

export interface AggregateDefinition {
  getInitialState: GetInitialState<State>;

  commandHandlers: Record<string, CommandHandler<State, CommandData>>;

  domainEventHandlers: Record<string, DomainEventHandler<State, DomainEventData>>;
}

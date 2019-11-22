import { DomainEventData } from '../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../common/elements/DomainEventWithState';
import { State } from '../../common/elements/State';

export type OnReceiveDomainEvent = ({ domainEvent }: {
  domainEvent: DomainEventWithState<DomainEventData, State>;
}) => Promise<void>;

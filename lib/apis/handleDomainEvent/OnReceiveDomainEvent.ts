import { DomainEvent } from '../../common/elements/DomainEvent';
import { DomainEventData } from '../../common/elements/DomainEventData';

export type OnReceiveDomainEvent = ({ domainEvent }: {
  domainEvent: DomainEvent<DomainEventData>;
}) => Promise<void>;

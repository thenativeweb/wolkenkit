import { DomainEvent } from '../../common/elements/DomainEvent';
import { DomainEventData } from '../../common/elements/DomainEventData';
export declare type OnReceiveDomainEvent = ({ flowNames, domainEvent }: {
    flowNames: string[];
    domainEvent: DomainEvent<DomainEventData>;
}) => Promise<void>;

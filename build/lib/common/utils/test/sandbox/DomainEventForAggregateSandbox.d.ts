import { DomainEventData } from '../../../elements/DomainEventData';
import { Initiator } from '../../../elements/Initiator';
export interface DomainEventForAggregateSandbox<TDomainEventData extends DomainEventData> {
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
}

import { AggregateIdentifier } from '../../../elements/AggregateIdentifier';
import { DomainEventData } from '../../../elements/DomainEventData';
import { Initiator } from '../../../elements/Initiator';
export interface DomainEventForFlowSandbox<TDomainEventData extends DomainEventData> {
    aggregateIdentifier: AggregateIdentifier;
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
}

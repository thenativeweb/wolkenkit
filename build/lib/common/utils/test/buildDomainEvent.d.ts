import { AggregateIdentifier } from '../../elements/AggregateIdentifier';
import { DomainEvent } from '../../elements/DomainEvent';
import { Initiator } from '../../elements/Initiator';
declare const buildDomainEvent: <TDomainEventData extends object>({ aggregateIdentifier, name, data, id, metadata }: {
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TDomainEventData;
    id?: string | undefined;
    metadata: {
        causationId?: string;
        correlationId?: string;
        timestamp?: number;
        revision: number;
        initiator?: Initiator;
        tags?: string[];
    };
}) => DomainEvent<TDomainEventData>;
export { buildDomainEvent };

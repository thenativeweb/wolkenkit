import { AggregateIdentifier } from '../../elements/AggregateIdentifier';
import { Client } from '../../elements/Client';
import { CommandWithMetadata } from '../../elements/CommandWithMetadata';
import { Initiator } from '../../elements/Initiator';
declare const buildCommandWithMetadata: <TCommandData extends object>({ aggregateIdentifier, name, data, id, metadata }: {
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TCommandData;
    id?: string | undefined;
    metadata?: {
        causationId?: string | undefined;
        correlationId?: string | undefined;
        timestamp?: number | undefined;
        client?: Client | undefined;
        initiator?: Initiator | undefined;
    } | undefined;
}) => CommandWithMetadata<TCommandData>;
export { buildCommandWithMetadata };

import { Client } from '../../../elements/Client';
import { CommandData } from '../../../elements/CommandData';
import { Initiator } from '../../../elements/Initiator';
export interface CommandForAggregateSandbox<TCommandData extends CommandData> {
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
}

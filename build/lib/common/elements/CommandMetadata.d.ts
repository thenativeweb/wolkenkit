import { Client } from './Client';
import { Initiator } from './Initiator';
export interface CommandMetadata {
    causationId: string;
    correlationId: string;
    timestamp: number;
    client: Client;
    initiator: Initiator;
}

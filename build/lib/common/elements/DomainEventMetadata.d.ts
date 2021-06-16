import { Initiator } from './Initiator';
export interface DomainEventMetadata {
    causationId: string;
    correlationId: string;
    timestamp: number;
    revision: number;
    initiator: Initiator;
    tags: string[];
}

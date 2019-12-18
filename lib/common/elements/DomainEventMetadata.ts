import { Initiator } from './Initiator';

export interface DomainEventMetadata {
  causationId: string;
  correlationId: string;
  timestamp: number;
  revision: {
    aggregate: number;
    global: number | null;
  };
  initiator: Initiator;
  tags: string[];
}

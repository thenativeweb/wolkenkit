import { Initiator } from './Initiator';

export interface DomainEventMetadata {
  causationId: string;
  correlationId: string;
  timestamp: number;
  isPublished: boolean;
  revision: {
    aggregate: number;
    global: number | null;
  };
  initiator: Initiator;
  tags: string[];
}

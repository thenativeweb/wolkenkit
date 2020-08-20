import { DomainEventData } from '../../../elements/DomainEventData';
import { Initiator } from '../../../elements/Initiator';

export interface DomainEventForFlowSandbox<TDomainEventData extends DomainEventData> {
  contextIdentifier: { name: string };
  aggregateIdentifier: { name: string; id: string };
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

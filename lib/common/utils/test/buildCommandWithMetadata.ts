import { AggregateIdentifier } from '../../elements/AggregateIdentifier';
import { Client } from '../../elements/Client';
import { CommandData } from '../../elements/CommandData';
import { CommandWithMetadata } from '../../elements/CommandWithMetadata';
import { ContextIdentifier } from '../../elements/ContextIdentifier';
import { Initiator } from '../../elements/Initiator';
import { v4 } from 'uuid';

const buildCommandWithMetadata = function <TCommandData extends CommandData> ({
  contextIdentifier,
  aggregateIdentifier,
  name,
  data,
  id,
  metadata
}: {
  contextIdentifier: ContextIdentifier;
  aggregateIdentifier: AggregateIdentifier;
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
}): CommandWithMetadata<TCommandData> {
  return new CommandWithMetadata({
    contextIdentifier,
    aggregateIdentifier,
    name,
    data,
    id: id ?? v4(),
    metadata: {
      causationId: metadata?.causationId ?? v4(),
      correlationId: metadata?.correlationId ?? v4(),
      timestamp: metadata?.timestamp ?? Date.now(),
      client: metadata?.client ?? {
        ip: '127.0.0.1',
        user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
        token: '...'
      },
      initiator: metadata?.initiator ?? {
        user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
      }
    }
  });
};

export { buildCommandWithMetadata };

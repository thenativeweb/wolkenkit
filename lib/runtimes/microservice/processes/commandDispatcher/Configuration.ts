import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { DistributiveOmit } from '../../../../common/types/DistributiveOmit';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { PriorityQueueStoreOptions } from '../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';

export interface Configuration {
  applicationDirectory: string;
  awaitCommandCorsOrigin: string | string[];
  handleCommandCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  healthPort: number;
  missedCommandRecoveryInterval: number;
  port: number;
  priorityQueueStoreOptions: DistributiveOmit<PriorityQueueStoreOptions<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'>;
  pubSubOptions: {
    channel: string;
    subscriber: object;
    publisher: object;
  };
  pubSubType: string;
}

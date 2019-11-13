import { CommandData } from '../../common/elements/CommandData';
import { CommandWithMetadata } from '../../common/elements/CommandWithMetadata';

export interface Queue {
  aggregateId: string;
  waitingSince: number;
  processingUntil: number;
  token: string;
  items: (CommandWithMetadata<CommandData> | undefined)[];
}

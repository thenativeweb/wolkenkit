import CommandInternal from '../../common/elements/CommandInternal';

export interface Queue {
  aggregateId: string;
  waitingSince: number;
  processingUntil: number;
  token: string;
  items: (CommandInternal | undefined)[];
}

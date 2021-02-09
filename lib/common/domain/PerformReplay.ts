import { AggregateIdentifier } from '../elements/AggregateIdentifier';

export type PerformReplay = ({ flowNames, aggregates }: {
  flowNames: string[];
  aggregates: {
    aggregateIdentifier: AggregateIdentifier;
    from: number;
    to: number;
  }[];
}) => Promise<void>;

import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import { ContextIdentifier } from '../../common/elements/ContextIdentifier';

export type PerformReplay = ({ flowNames, aggregates }: {
  flowNames: string[];
  aggregates: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    from: number;
    to: number;
  }[];
}) => Promise<void>;

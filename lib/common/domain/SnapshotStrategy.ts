import { Snapshot } from '../../stores/domainEventStore/Snapshot';
import { State } from '../elements/State';

export type SnapshotStrategy = (params: {
  latestSnapshot: Snapshot<State> | undefined;
  replayDuration: number;
  replayedDomainEvents: number;
}) => boolean;

import { Snapshot } from '../../stores/domainEventStore/Snapshot';
import { State } from '../elements/State';
export declare type SnapshotStrategy = (params: {
    latestSnapshot: Snapshot<State> | undefined;
    replayDuration: number;
    replayedDomainEvents: number;
}) => boolean;

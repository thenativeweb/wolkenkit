export type SnapshotStrategy = (params: {
  lastSnapshotRevision: number;
  lastSnapshotTimestamp: number;
  currentRevision: number;
  currentTimestamp: number;
}) => boolean;

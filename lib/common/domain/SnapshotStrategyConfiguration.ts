export type SnapshotStrategyConfiguration =
  {
    name: 'never';
  } | {
    name: 'lowest';
    configuration: {
      revisionDelta: number;
      timestampDelta: number;
    };
  } | {
    name: 'revision';
    configuration: {
      revisionDelta: number;
    };
  } | {
    name: 'timestamp';
    configuration: {
      timestampDelta: number;
    };
  };

import { errors } from '../errors';
import { SnapshotStrategy } from './SnapshotStrategy';
import { SnapshotStrategyConfiguration } from './SnapshotStrategyConfiguration';

const getSnapshotStrategy = function (
  snapshotStrategyConfiguration: SnapshotStrategyConfiguration
): SnapshotStrategy {
  switch (snapshotStrategyConfiguration.name) {
    case 'lowest': {
      const timestampDeltaLimit = snapshotStrategyConfiguration.configuration.timestampDelta;
      const revisionDeltaLimit = snapshotStrategyConfiguration.configuration.revisionDelta;

      return ({ lastSnapshotRevision, lastSnapshotTimestamp, currentRevision, currentTimestamp }): boolean => {
        const timestampDelta = currentTimestamp - lastSnapshotTimestamp;
        const revisionDelta = currentRevision - lastSnapshotRevision;

        return timestampDelta >= timestampDeltaLimit || revisionDelta >= revisionDeltaLimit;
      };
    }
    case 'revision': {
      const revisionDeltaLimit = snapshotStrategyConfiguration.configuration.revisionDelta;

      return ({ lastSnapshotRevision, currentRevision }): boolean => {
        const revisionDelta = currentRevision - lastSnapshotRevision;

        return revisionDelta >= revisionDeltaLimit;
      };
    }
    case 'timestamp': {
      const timestampDeltaLimit = snapshotStrategyConfiguration.configuration.timestampDelta;

      return ({ lastSnapshotTimestamp, currentTimestamp }): boolean => {
        const timestampDelta = currentTimestamp - lastSnapshotTimestamp;

        return timestampDelta >= timestampDeltaLimit;
      };
    }
    case 'never': {
      return (): boolean => false;
    }
    default: {
      throw new errors.InvalidOperation();
    }
  }
};

export {
  getSnapshotStrategy
};

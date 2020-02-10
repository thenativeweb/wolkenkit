import { errors } from '../errors';
import { SnapshotStrategy } from './SnapshotStrategy';
import { SnapshotStrategyConfiguration } from './SnapshotStrategyConfiguration';

const getSnapshotStrategy = function (
  snapshotStrategyConfiguration: SnapshotStrategyConfiguration
): SnapshotStrategy {
  switch (snapshotStrategyConfiguration.name) {
    case 'lowest': {
      const { durationLimit, revisionLimit } = snapshotStrategyConfiguration.configuration;

      return ({ replayDuration, replayedDomainEvents }): boolean =>
        replayDuration >= durationLimit || replayedDomainEvents >= revisionLimit;
    }
    case 'revision': {
      const { revisionLimit } = snapshotStrategyConfiguration.configuration;

      return ({ replayedDomainEvents }): boolean =>
        replayedDomainEvents >= revisionLimit;
    }
    case 'duration': {
      const { durationLimit } = snapshotStrategyConfiguration.configuration;

      return ({ replayDuration }): boolean =>
        replayDuration >= durationLimit;
    }
    case 'always': {
      return (): boolean => true;
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

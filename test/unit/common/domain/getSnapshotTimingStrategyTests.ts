import { assert } from 'assertthat';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';

suite('getSnapshotStrategy', (): void => {
  suite('lowest', (): void => {
    test('returns true if the revision delta exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        durationLimit: 500,
        revisionLimit: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'lowest',
        configuration
      });

      const shouldCreateSnapshot = snapshotStrategy({
        latestSnapshot: undefined,
        replayDuration: 200,
        replayedDomainEvents: 105
      });

      assert.that(shouldCreateSnapshot).is.true();
    });

    test('returns true if the time delta exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        durationLimit: 500,
        revisionLimit: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'lowest',
        configuration
      });

      const shouldCreateSnapshot = snapshotStrategy({
        latestSnapshot: undefined,
        replayDuration: 600,
        replayedDomainEvents: 50
      });

      assert.that(shouldCreateSnapshot).is.true();
    });

    test('returns false if neither exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        durationLimit: 500,
        revisionLimit: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'lowest',
        configuration
      });

      const shouldCreateSnapshot = snapshotStrategy({
        latestSnapshot: undefined,
        replayDuration: 250,
        replayedDomainEvents: 45
      });

      assert.that(shouldCreateSnapshot).is.false();
    });
  });

  suite('revision', (): void => {
    test('returns true if the revision delta exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        revisionLimit: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'revision',
        configuration
      });

      const shouldCreateSnapshot = snapshotStrategy({
        latestSnapshot: undefined,
        replayDuration: 200,
        replayedDomainEvents: 105
      });

      assert.that(shouldCreateSnapshot).is.true();
    });

    test(`returns false if the revision delta doesn't exceed the limit.`, async (): Promise<void> => {
      const configuration = {
        revisionLimit: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'revision',
        configuration
      });

      const shouldCreateSnapshot = snapshotStrategy({
        latestSnapshot: undefined,
        replayDuration: 200,
        replayedDomainEvents: 37
      });

      assert.that(shouldCreateSnapshot).is.false();
    });
  });

  suite('duration', (): void => {
    test('returns true if the duration exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        durationLimit: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'duration',
        configuration
      });

      const shouldCreateSnapshot = snapshotStrategy({
        latestSnapshot: undefined,
        replayDuration: 200,
        replayedDomainEvents: 105
      });

      assert.that(shouldCreateSnapshot).is.true();
    });

    test(`returns false if the duration doesn't exceed the limit.`, async (): Promise<void> => {
      const configuration = {
        durationLimit: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'duration',
        configuration
      });

      const shouldCreateSnapshot = snapshotStrategy({
        latestSnapshot: undefined,
        replayDuration: 68,
        replayedDomainEvents: 105
      });

      assert.that(shouldCreateSnapshot).is.false();
    });
  });

  suite('never', (): void => {
    test('returns false.', async (): Promise<void> => {
      const snapshotStrategy = getSnapshotStrategy({
        name: 'never'
      });

      const shouldCreateSnapshot = snapshotStrategy({
        latestSnapshot: undefined,
        replayDuration: 200_000,
        replayedDomainEvents: 10_000
      });

      assert.that(shouldCreateSnapshot).is.false();
    });
  });
});

import { assert } from 'assertthat';
import { getSnapshotStrategy } from 'lib/common/domain/getSnapshotStrategy';

suite('getSnapshotStrategy', (): void => {
  suite('lowest', (): void => {
    test('it returns true if the revision delta exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        timestampDelta: 500,
        revisionDelta: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'lowest',
        configuration
      });

      const lastSnapshotRevision = 1;
      const lastSnapshotTimestamp = Date.now();
      const currentRevision = lastSnapshotRevision + 105;
      const currentTimestamp = lastSnapshotTimestamp + 200;

      const shouldCreateSnapshot = snapshotStrategy({
        lastSnapshotRevision,
        lastSnapshotTimestamp,
        currentRevision,
        currentTimestamp
      });

      assert.that(shouldCreateSnapshot).is.true();
    });

    test('it returns true if the time delta exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        timestampDelta: 500,
        revisionDelta: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'lowest',
        configuration
      });

      const lastSnapshotRevision = 1;
      const lastSnapshotTimestamp = Date.now();
      const currentRevision = lastSnapshotRevision + 50;
      const currentTimestamp = lastSnapshotTimestamp + 600;

      const shouldCreateSnapshot = snapshotStrategy({
        lastSnapshotRevision,
        lastSnapshotTimestamp,
        currentRevision,
        currentTimestamp
      });

      assert.that(shouldCreateSnapshot).is.true();
    });

    test('it returns false if neither exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        timestampDelta: 500,
        revisionDelta: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'lowest',
        configuration
      });

      const lastSnapshotRevision = 1;
      const lastSnapshotTimestamp = Date.now();
      const currentRevision = lastSnapshotRevision + 45;
      const currentTimestamp = lastSnapshotTimestamp + 250;

      const shouldCreateSnapshot = snapshotStrategy({
        lastSnapshotRevision,
        lastSnapshotTimestamp,
        currentRevision,
        currentTimestamp
      });

      assert.that(shouldCreateSnapshot).is.false();
    });
  });

  suite('revision', (): void => {
    test('it returns true if the revision delta exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        revisionDelta: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'revision',
        configuration
      });

      const lastSnapshotRevision = 1;
      const lastSnapshotTimestamp = Date.now();
      const currentRevision = lastSnapshotRevision + 105;
      const currentTimestamp = lastSnapshotTimestamp + 200;

      const shouldCreateSnapshot = snapshotStrategy({
        lastSnapshotRevision,
        lastSnapshotTimestamp,
        currentRevision,
        currentTimestamp
      });

      assert.that(shouldCreateSnapshot).is.true();
    });

    test(`it returns false if the revision delta doesn't exceed the limit.`, async (): Promise<void> => {
      const configuration = {
        revisionDelta: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'revision',
        configuration
      });

      const lastSnapshotRevision = 1;
      const lastSnapshotTimestamp = Date.now();
      const currentRevision = lastSnapshotRevision + 37;
      const currentTimestamp = lastSnapshotTimestamp + 200;

      const shouldCreateSnapshot = snapshotStrategy({
        lastSnapshotRevision,
        lastSnapshotTimestamp,
        currentRevision,
        currentTimestamp
      });

      assert.that(shouldCreateSnapshot).is.false();
    });
  });

  suite('timestamp', (): void => {
    test('it returns true if the timestamp delta exceeds the limit.', async (): Promise<void> => {
      const configuration = {
        timestampDelta: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'timestamp',
        configuration
      });

      const lastSnapshotRevision = 1;
      const lastSnapshotTimestamp = Date.now();
      const currentRevision = lastSnapshotRevision + 105;
      const currentTimestamp = lastSnapshotTimestamp + 200;

      const shouldCreateSnapshot = snapshotStrategy({
        lastSnapshotRevision,
        lastSnapshotTimestamp,
        currentRevision,
        currentTimestamp
      });

      assert.that(shouldCreateSnapshot).is.true();
    });

    test(`it returns false if the timestamp delta doesn't exceed the limit.`, async (): Promise<void> => {
      const configuration = {
        timestampDelta: 100
      };

      const snapshotStrategy = getSnapshotStrategy({
        name: 'timestamp',
        configuration
      });

      const lastSnapshotRevision = 1;
      const lastSnapshotTimestamp = Date.now();
      const currentRevision = lastSnapshotRevision + 105;
      const currentTimestamp = lastSnapshotTimestamp + 68;

      const shouldCreateSnapshot = snapshotStrategy({
        lastSnapshotRevision,
        lastSnapshotTimestamp,
        currentRevision,
        currentTimestamp
      });

      assert.that(shouldCreateSnapshot).is.false();
    });
  });

  suite('never', (): void => {
    test('it returns false.', async (): Promise<void> => {
      const snapshotStrategy = getSnapshotStrategy({
        name: 'never'
      });

      const lastSnapshotRevision = 1;
      const lastSnapshotTimestamp = Date.now();
      const currentRevision = lastSnapshotRevision + 10_000;
      const currentTimestamp = lastSnapshotTimestamp + 200_000;

      const shouldCreateSnapshot = snapshotStrategy({
        lastSnapshotRevision,
        lastSnapshotTimestamp,
        currentRevision,
        currentTimestamp
      });

      assert.that(shouldCreateSnapshot).is.false();
    });
  });
});

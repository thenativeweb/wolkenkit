import { errors } from '../errors';
import { getSnapshotSchema } from '../schemas/getSnapshotSchema';
import { Snapshot } from '../../stores/domainEventStore/Snapshot';

const validateSnapshot = function ({
  snapshot
}: {
  snapshot: Snapshot<any>;
}): void {
  const schemaSnapshot = getSnapshotSchema();

  try {
    schemaSnapshot.validate(snapshot, { valueName: 'snapshot' });
  } catch (ex) {
    throw new errors.SnapshotMalformed(ex.message);
  }
};

export { validateSnapshot };

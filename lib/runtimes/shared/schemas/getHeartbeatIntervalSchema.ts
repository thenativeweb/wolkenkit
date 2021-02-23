import { Schema } from '../../../common/elements/Schema';

const getHeartbeatIntervalSchema = function (): Schema {
  return {
    type: 'integer',
    minimum: 10_000
  };
};

export { getHeartbeatIntervalSchema };

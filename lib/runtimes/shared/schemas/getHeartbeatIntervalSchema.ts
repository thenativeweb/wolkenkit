import { GraphqlIncompatibleSchema } from '../../../common/elements/Schema';

const getHeartbeatIntervalSchema = function (): GraphqlIncompatibleSchema {
  return {
    type: 'integer',
    minimum: 10_000
  };
};

export { getHeartbeatIntervalSchema };

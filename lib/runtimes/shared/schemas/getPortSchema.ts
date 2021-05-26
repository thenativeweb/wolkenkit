import { GraphqlIncompatibleSchema } from '../../../common/elements/Schema';

const getPortSchema = function (): GraphqlIncompatibleSchema {
  return {
    type: 'integer',
    minimum: 1,
    maximum: 65_535
  };
};

export { getPortSchema };

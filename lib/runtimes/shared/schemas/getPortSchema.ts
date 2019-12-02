import { Schema } from '../../../common/elements/Schema';

const getPortSchema = function (): Schema {
  return {
    type: 'integer',
    minimum: 1,
    maximum: 65535
  };
};

export {
  getPortSchema
};

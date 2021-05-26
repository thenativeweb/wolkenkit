import { GraphqlIncompatibleSchema } from '../../../common/elements/Schema';

const getProtocolSchema = function (): GraphqlIncompatibleSchema {
  return {
    type: 'string',
    enum: [ 'http', 'https' ]
  };
};

export {
  getProtocolSchema
};

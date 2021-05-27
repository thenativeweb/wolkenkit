import { Schema } from '../../../common/elements/Schema';

const getPortOrSocketSchema = function (): Schema {
  return {
    oneOf: [
      {
        type: 'integer',
        minimum: 1,
        maximum: 65_535
      },
      {
        type: 'string',
        minLength: 1
      }
    ]
  };
};

export { getPortOrSocketSchema };

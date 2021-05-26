import { GraphqlIncompatibleSchema } from '../../../common/elements/Schema';

const getCorsSchema = function (): GraphqlIncompatibleSchema {
  return {
    anyOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' }}
    ]
  };
};

export {
  getCorsSchema
};

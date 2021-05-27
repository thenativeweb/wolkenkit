import { Schema } from '../../../common/elements/Schema';

const getCorsSchema = function (): Schema {
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

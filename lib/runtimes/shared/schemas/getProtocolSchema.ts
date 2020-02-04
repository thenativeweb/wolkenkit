import { Schema } from '../../../common/elements/Schema';

const getProtocolSchema = function (): Schema {
  return {
    type: 'string',
    enum: [ 'http', 'https' ]
  };
};

export {
  getProtocolSchema
};

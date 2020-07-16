import { jsonSchema } from 'uuidv4';
import { Schema } from '../elements/Schema';

const getFileAddMetadataSchema = function (): Schema {
  const contentTypeRegex = /^\w+\/[-.\w]+(?:+[-.\w]+)?$/u;

  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const contentTypeRegexAsString = contentTypeRegex.toString().slice(1, -1);

  return {
    type: 'object',
    properties: {
      id: jsonSchema.v4 as Schema,
      name: {
        type: 'string',
        minLength: 1
      },
      contentType: {
        type: 'string',
        pattern: contentTypeRegexAsString
      }
    },
    required: [ 'id', 'name', 'contentType' ],
    additionalProperties: false
  };
};

export { getFileAddMetadataSchema };

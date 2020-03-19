import { getSchema } from './getCommandSchema';
import { Schema } from '../elements/Schema';

const getCommandSchemaForGraphql = function (): Schema {
  const commandSchema = getSchema();

  commandSchema.properties!.data = {
    type: 'string',
    description: `The command's payload as a JSON string.`
  };

  return commandSchema;
};

export { getCommandSchemaForGraphql };

import { getSchema } from './getDomainEventSchema';
import { Schema } from '../elements/Schema';

const getDomainEventSchemaForGraphql = function (): Schema {
  const domainEventSchema = getSchema();

  domainEventSchema.properties!.data = {
    type: 'string',
    description: `The event's payload as a JSON string.`
  };

  delete domainEventSchema.properties!.metadata!.properties!.initiator!.properties!.user!.properties!.claims;
  domainEventSchema.properties!.metadata!.properties!.initiator!.properties!.user!.required = [ 'id' ];

  return domainEventSchema;
};

export { getDomainEventSchemaForGraphql };

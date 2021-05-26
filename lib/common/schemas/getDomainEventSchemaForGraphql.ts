import { getDomainEventSchema } from './getDomainEventSchema';
import { Schema } from '../elements/Schema';

const getDomainEventSchemaForGraphql = function (): Schema {
  const domainEventSchema = getDomainEventSchema();

  domainEventSchema.properties!.data = {
    type: 'string',
    description: `The event's payload as a JSON string.`
  };

  delete (domainEventSchema as any).properties.metadata.properties.initiator.properties.user.properties.claims;
  (domainEventSchema as any).properties!.metadata!.properties!.initiator!.properties!.user!.required = [ 'id' ];

  return domainEventSchema as Schema;
};

export { getDomainEventSchemaForGraphql };

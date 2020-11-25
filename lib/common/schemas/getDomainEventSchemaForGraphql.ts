import { getDomainEventSchema } from './getDomainEventSchema';
import { Schema } from '../elements/Schema';

const getDomainEventSchemaForGraphql = function (): Schema {
  const domainEventSchema = getDomainEventSchema();

  domainEventSchema.properties!.data = {
    type: 'string',
    description: `The event's payload as a JSON string.`
  };

  delete (((domainEventSchema.properties!.metadata! as Schema).properties!.initiator! as Schema).properties!.user! as Schema).properties!.claims;
  (((domainEventSchema.properties!.metadata! as Schema).properties!.initiator! as Schema).properties!.user! as Schema).required = [ 'id' ];

  return domainEventSchema;
};

export { getDomainEventSchemaForGraphql };

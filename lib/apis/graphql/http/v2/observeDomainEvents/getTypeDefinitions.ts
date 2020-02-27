import { getDomainEventSchema } from '../../../shared/schemas/getDomainEventSchema';
import { getGraphqlFromJsonSchema } from 'get-graphql-from-jsonschema';
import { Schema } from '../../../../../common/elements/Schema';
import { stripIndent } from 'common-tags';

const getTypeDefinitions = function (): string {
  const domainEventSchema: Schema = getDomainEventSchema();
  const domainEventGraphQL = getGraphqlFromJsonSchema({
    schema: domainEventSchema,
    rootName: 'DomainEvent',
    direction: 'output'
  });

  return stripIndent`
    ${domainEventGraphQL.typeDefinitions.join('\n')}
    
    type Subscription {
      domainEvents (filter: String): ${domainEventGraphQL.typeName}
    }
  `;
};

export { getTypeDefinitions };

import { DomainEventDefinitions } from './DomainEventDefinitions';
import { DomainEventDescriptions } from './DomainEventDescriptions';
import { stripIndent } from 'common-tags';

const getDomainEventDescriptions = function ({ domainEventDefinitions }: {
  domainEventDefinitions: DomainEventDefinitions;
}): DomainEventDescriptions {
  const domainEventDescriptions: DomainEventDescriptions = {};

  for (const [ contextName, contextDefinition ] of Object.entries(domainEventDefinitions)) {
    domainEventDescriptions[contextName] = {};

    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      domainEventDescriptions[contextName][aggregateName] = {};

      for (const [ domainEventName, domainEventDefinition ] of Object.entries(aggregateDefinition)) {
        const { getDocumentation, getSchema } = domainEventDefinition;

        domainEventDescriptions[contextName][aggregateName][domainEventName] = {
          documentation: getDocumentation ? stripIndent(getDocumentation().trim()) : undefined,
          schema: getSchema ? getSchema() : undefined
        };
      }
    }
  }

  return domainEventDescriptions;
};

export { getDomainEventDescriptions };

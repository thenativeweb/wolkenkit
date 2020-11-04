import { DomainDefinition } from './DomainDefinition';
import { DomainEventsDescription } from './DomainEventsDescription';
import { stripIndent } from 'common-tags';

const getDomainEventsDescription = function ({ domainDefinition }: {
  domainDefinition: DomainDefinition;
}): DomainEventsDescription {
  const domainEventsDescription: DomainEventsDescription = {};

  for (const [ contextName, contextDefinition ] of Object.entries(domainDefinition)) {
    domainEventsDescription[contextName] = {};

    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      domainEventsDescription[contextName][aggregateName] = {};

      for (const [ domainEventName, domainEventHandler ] of Object.entries(aggregateDefinition.domainEventHandlers)) {
        const description = {} as any;

        if (domainEventHandler.getDocumentation) {
          description.documentation = stripIndent(domainEventHandler.getDocumentation().trim());
        }
        if (domainEventHandler.getSchema) {
          description.schema = domainEventHandler.getSchema();
        }

        domainEventsDescription[contextName][aggregateName][domainEventName] = description;
      }
    }
  }

  return domainEventsDescription;
};

export { getDomainEventsDescription };

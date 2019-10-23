import { ApplicationDescription } from './ApplicationDescription';
import getApplicationDefinition from './getApplicationDefinition';
import { stripIndent } from 'common-tags';

const getApplicationDescription = async function ({ applicationDirectory }: {
  applicationDirectory: string;
}): Promise<ApplicationDescription> {
  const applicationDefinition = await getApplicationDefinition({ applicationDirectory });

  const applicationDescription: ApplicationDescription = {
    commands: {},
    domainEvents: {},
    views: {}
  };

  for (const [ contextName, contextDefinition ] of Object.entries(applicationDefinition.commands)) {
    applicationDescription.commands[contextName] = {};

    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      applicationDescription.commands[contextName][aggregateName] = {};

      for (const [ commandName, commandDefinition ] of Object.entries(aggregateDefinition)) {
        const { getDocumentation, getSchema } = commandDefinition;

        applicationDescription.commands[contextName][aggregateName][commandName] = {
          documentation: getDocumentation ? stripIndent(getDocumentation().trim()) : undefined,
          schema: getSchema ? getSchema() : undefined
        };
      }
    }
  }

  for (const [ contextName, contextDefinition ] of Object.entries(applicationDefinition.domainEvents)) {
    applicationDescription.domainEvents[contextName] = {};

    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      applicationDescription.domainEvents[contextName][aggregateName] = {};

      for (const [ domainEventName, domainEventDefinition ] of Object.entries(aggregateDefinition)) {
        const { getDocumentation, getSchema } = domainEventDefinition;

        applicationDescription.domainEvents[contextName][aggregateName][domainEventName] = {
          documentation: getDocumentation ? stripIndent(getDocumentation().trim()) : undefined,
          schema: getSchema ? getSchema() : undefined
        };
      }
    }
  }

  for (const [ viewName, viewDefinition ] of Object.entries(applicationDefinition.views)) {
    applicationDescription.views[viewName] = {
      queries: {}
    };

    for (const [ queryName, queryDefinition ] of Object.entries(viewDefinition.queries)) {
      const { getDocumentation, getOptionsSchema, getItemSchema } = queryDefinition;

      applicationDescription.views[viewName].queries[queryName] = {
        documentation: getDocumentation ? stripIndent(getDocumentation().trim()) : undefined,
        optionsSchema: getOptionsSchema ? getOptionsSchema() : undefined,
        itemSchema: getItemSchema ? getItemSchema() : undefined
      };
    }
  }

  return applicationDescription;
};

export default getApplicationDescription;

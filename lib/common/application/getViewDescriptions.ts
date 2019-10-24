import { stripIndent } from 'common-tags';
import { ViewDefinitions } from './ViewDefinitions';
import { ViewDescriptions } from './ViewDescriptions';

const getViewDescriptions = function ({ viewDefinitions }: {
  viewDefinitions: ViewDefinitions;
}): ViewDescriptions {
  const viewDescriptions: ViewDescriptions = {};

  for (const [ viewName, viewDefinition ] of Object.entries(viewDefinitions)) {
    viewDescriptions[viewName] = {
      queries: {}
    };

    for (const [ queryName, queryDefinition ] of Object.entries(viewDefinition.queries)) {
      const { getDocumentation, getOptionsSchema, getItemSchema } = queryDefinition;

      viewDescriptions[viewName].queries[queryName] = {
        documentation: getDocumentation ? stripIndent(getDocumentation().trim()) : undefined,
        optionsSchema: getOptionsSchema ? getOptionsSchema() : undefined,
        itemSchema: getItemSchema ? getItemSchema() : undefined
      };
    }
  }

  return viewDescriptions;
};

export { getViewDescriptions };

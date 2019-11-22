import { stripIndent } from 'common-tags';
import { ViewsDefinition } from './ViewsDefinition';
import { ViewsDescription } from './ViewsDescription';

const getViewsDescription = function ({ viewsDefinition }: {
  viewsDefinition: ViewsDefinition;
}): ViewsDescription {
  const viewsDescription: ViewsDescription = {};

  for (const [ viewName, viewDefinition ] of Object.entries(viewsDefinition)) {
    viewsDescription[viewName] = {
      queries: {}
    };

    for (const [ queryName, queryHandler ] of Object.entries(viewDefinition.queryHandlers)) {
      const { getDocumentation, getOptionsSchema, getResultItemSchema: getItemSchema } = queryHandler;

      viewsDescription[viewName].queries[queryName] = {
        documentation: getDocumentation ? stripIndent(getDocumentation().trim()) : undefined,
        optionsSchema: getOptionsSchema ? getOptionsSchema() : undefined,
        itemSchema: getItemSchema ? getItemSchema() : undefined
      };
    }
  }

  return viewsDescription;
};

export { getViewsDescription };

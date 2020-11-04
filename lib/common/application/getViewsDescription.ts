import { stripIndent } from 'common-tags';
import { ViewsDefinition } from './ViewsDefinition';
import { ViewsDescription } from './ViewsDescription';

const getViewsDescription = function ({ viewsDefinition }: {
  viewsDefinition: ViewsDefinition;
}): ViewsDescription {
  const viewsDescription: ViewsDescription = {};

  for (const [ viewName, viewDefinition ] of Object.entries(viewsDefinition)) {
    viewsDescription[viewName] = {};

    for (const [ queryName, queryHandler ] of Object.entries(viewDefinition.queryHandlers)) {
      const queryDescription = {} as any;

      if (queryHandler.getDocumentation) {
        queryDescription.documentation = stripIndent(queryHandler.getDocumentation().trim());
      }
      if (queryHandler.getOptionsSchema) {
        queryDescription.optionsSchema = queryHandler.getOptionsSchema();
      }
      if (queryHandler.getResultItemSchema) {
        queryDescription.itemSchema = queryHandler.getResultItemSchema();
      }

      viewsDescription[viewName][queryName] = queryDescription;
    }
  }

  return viewsDescription;
};

export { getViewsDescription };

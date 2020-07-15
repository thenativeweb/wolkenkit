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
      const { getDocumentation, getOptionsSchema, getResultItemSchema: getItemSchema } = queryHandler;

      const queryDescription = {} as any;

      if (getDocumentation) {
        queryDescription.documentation = stripIndent(getDocumentation().trim());
      }
      if (getOptionsSchema) {
        queryDescription.optionsSchema = getOptionsSchema();
      }
      if (getItemSchema) {
        queryDescription.itemSchema = getItemSchema();
      }

      viewsDescription[viewName][queryName] = queryDescription;
    }
  }

  return viewsDescription;
};

export { getViewsDescription };

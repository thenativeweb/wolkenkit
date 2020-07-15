import { Application } from '../../../../common/application/Application';
import { getQueryFieldConfiguration } from './getQueryFieldConfiguration';
import { ResolverContext } from '../ResolverContext';
import { ViewDefinition } from '../../../../common/application/ViewDefinition';
import { GraphQLFieldConfig, GraphQLFieldConfigMap, GraphQLObjectType } from 'graphql';

const getViewFieldConfiguration = function ({ application, view, viewName }: {
  application: Application;
  view: ViewDefinition;
  viewName: string;
}): GraphQLFieldConfig<any, ResolverContext> {
  const viewFieldConfigurations: GraphQLFieldConfigMap<{ viewName: string }, ResolverContext> = {};

  for (const [ queryName, queryHandler ] of Object.entries(view.queryHandlers)) {
    viewFieldConfigurations[queryName] = getQueryFieldConfiguration({
      application,
      viewName,
      queryName,
      queryHandler
    });
  }

  return {
    type: new GraphQLObjectType({
      name: viewName,
      fields: viewFieldConfigurations
    }),
    resolve (): { viewName: string } {
      return { viewName };
    }
  };
};

export { getViewFieldConfiguration };

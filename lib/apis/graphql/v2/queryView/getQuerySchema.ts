import { Application } from '../../../../common/application/Application';
import { getViewFieldConfiguration } from './getViewFieldConfiguration';
import { ResolverContext } from '../ResolverContext';
import { GraphQLFieldConfigMap, GraphQLObjectType } from 'graphql';

const getQuerySchema = function ({ application }: {
  application: Application;
}): GraphQLObjectType {
  const queryFieldConfigurations: GraphQLFieldConfigMap<any, ResolverContext> = {};

  for (const [ viewName, view ] of Object.entries(application.views)) {
    queryFieldConfigurations[viewName] = getViewFieldConfiguration({
      application,
      view,
      viewName
    });
  }

  return new GraphQLObjectType<any, ResolverContext>({
    name: 'Query',
    fields: queryFieldConfigurations
  });
};

export { getQuerySchema };

import { Application } from '../../../../common/application/Application';
import { ResolverContext } from '../ResolverContext';
import { ViewDefinition } from '../../../../common/application/ViewDefinition';
import { GraphQLFieldConfig } from 'graphql';
declare const getViewFieldConfiguration: ({ application, view, viewName }: {
    application: Application;
    view: ViewDefinition;
    viewName: string;
}) => GraphQLFieldConfig<any, ResolverContext>;
export { getViewFieldConfiguration };

import { Application } from '../../../../common/application/Application';
import { QueryHandlerReturnsStream } from '../../../../common/elements/QueryHandlerReturnsStream';
import { QueryHandlerReturnsValue } from '../../../../common/elements/QueryHandlerReturnsValue';
import { ResolverContext } from '../ResolverContext';
import { GraphQLFieldConfig } from 'graphql';
declare const getQueryFieldConfiguration: ({ application, viewName, queryName, queryHandler }: {
    application: Application;
    viewName: string;
    queryName: string;
    queryHandler: QueryHandlerReturnsValue<any, any> | QueryHandlerReturnsStream<any, any>;
}) => GraphQLFieldConfig<{
    viewName: string;
}, ResolverContext, {
    [argName: string]: any;
}>;
export { getQueryFieldConfiguration };

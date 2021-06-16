import { Application } from '../../../../common/application/Application';
import { GraphQLObjectType } from 'graphql';
declare const getQuerySchema: ({ application }: {
    application: Application;
}) => GraphQLObjectType;
export { getQuerySchema };

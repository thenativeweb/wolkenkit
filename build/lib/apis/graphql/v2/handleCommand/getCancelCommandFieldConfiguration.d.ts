import { Application } from '../../../../common/application/Application';
import { OnCancelCommand } from '../../OnCancelCommand';
import { ResolverContext } from '../ResolverContext';
import { GraphQLFieldConfig } from 'graphql';
declare const getCancelCommandFieldConfiguration: ({ application, onCancelCommand }: {
    application: Application;
    onCancelCommand: OnCancelCommand;
}) => GraphQLFieldConfig<any, ResolverContext>;
export { getCancelCommandFieldConfiguration };

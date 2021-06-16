import { Application } from '../../../../common/application/Application';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { ResolverContext } from '../ResolverContext';
import { GraphQLFieldConfig } from 'graphql';
declare const getSendCommandFieldConfiguration: ({ application, onReceiveCommand }: {
    application: Application;
    onReceiveCommand: OnReceiveCommand;
}) => GraphQLFieldConfig<any, ResolverContext>;
export { getSendCommandFieldConfiguration };

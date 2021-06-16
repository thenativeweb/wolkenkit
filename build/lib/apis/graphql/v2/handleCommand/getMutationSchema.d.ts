import { Application } from '../../../../common/application/Application';
import { GraphQLObjectType } from 'graphql';
import { OnCancelCommand } from '../../OnCancelCommand';
import { OnReceiveCommand } from '../../OnReceiveCommand';
declare const getMutationSchema: ({ application, onReceiveCommand, onCancelCommand }: {
    application: Application;
    onReceiveCommand: OnReceiveCommand;
    onCancelCommand: OnCancelCommand;
}) => GraphQLObjectType;
export { getMutationSchema };

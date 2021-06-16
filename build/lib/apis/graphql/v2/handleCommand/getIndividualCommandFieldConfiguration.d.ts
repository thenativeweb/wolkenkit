import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { Application } from '../../../../common/application/Application';
import { CommandHandler } from '../../../../common/elements/CommandHandler';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { ResolverContext } from '../ResolverContext';
import { GraphQLFieldConfig } from 'graphql';
declare const getIndividualCommandFieldConfiguration: ({ application, contextName, aggregateName, commandName, commandHandler, onReceiveCommand }: {
    application: Application;
    contextName: string;
    aggregateName: string;
    commandName: string;
    commandHandler: CommandHandler<any, any, any>;
    onReceiveCommand: OnReceiveCommand;
}) => GraphQLFieldConfig<{
    aggregateIdentifier: AggregateIdentifier;
}, ResolverContext>;
export { getIndividualCommandFieldConfiguration };

import { Application } from '../../../../common/application/Application';
import { getIndividualCommandFieldConfiguration } from './getIndividualCommandFieldConfiguration';
import { GraphQLFieldConfigMap } from 'graphql/type/definition';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { ResolverContext } from '../ResolverContext';
import {
  GraphQLFieldConfig,
  GraphQLObjectType
} from 'graphql';

const getSendCommandFieldConfiguration = function ({ application, onReceiveCommand }: {
  application: Application;
  onReceiveCommand: OnReceiveCommand;
}): GraphQLFieldConfig<any, ResolverContext> {
  const commandFieldConfigurations: GraphQLFieldConfigMap<any, ResolverContext> = {};

  for (const [ contextName, context ] of Object.entries(application.domain)) {
    for (const [ aggregateName, aggregate ] of Object.entries(context)) {
      for (const [ commandName, commandHandler ] of Object.entries(aggregate.commandHandlers)) {
        commandFieldConfigurations[`${contextName}_${aggregateName}_${commandName}`] = getIndividualCommandFieldConfiguration({
          application,
          contextName,
          aggregateName,
          commandName,
          commandHandler,
          onReceiveCommand
        });
      }
    }
  }

  return {
    type: new GraphQLObjectType({
      name: 'command',
      fields: commandFieldConfigurations
    }),
    resolve (): any {
      return {};
    }
  };
};

export { getSendCommandFieldConfiguration };

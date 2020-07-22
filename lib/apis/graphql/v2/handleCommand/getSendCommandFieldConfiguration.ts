import { Application } from '../../../../common/application/Application';
import { getContextFieldConfiguration } from './getContextFieldConfiguration';
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
    commandFieldConfigurations[contextName] = getContextFieldConfiguration({
      application,
      context,
      contextName,
      onReceiveCommand
    });
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

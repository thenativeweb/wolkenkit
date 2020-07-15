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
  const commandObjectTypeFields: GraphQLFieldConfigMap<any, ResolverContext> = {};

  for (const [ contextName, context ] of Object.entries(application.domain)) {
    commandObjectTypeFields[contextName] = getContextFieldConfiguration({
      application,
      context,
      contextName,
      onReceiveCommand
    });
  }

  return {
    type: new GraphQLObjectType({
      name: 'command',
      fields: commandObjectTypeFields
    }),
    resolve (): any {
      return {};
    }
  };
};

export { getSendCommandFieldConfiguration };

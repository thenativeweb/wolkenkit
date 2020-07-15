import { Application } from '../../../../common/application/Application';
import { ContextDefinition } from '../../../../common/application/ContextDefinition';
import { ContextIdentifier } from '../../../../common/elements/ContextIdentifier';
import { getAggregateFieldConfiguration } from './getAggregateFieldConfiguration';
import { GraphQLFieldConfigMap } from 'graphql/type/definition';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { ResolverContext } from '../ResolverContext';
import {
  GraphQLFieldConfig,
  GraphQLObjectType
} from 'graphql';

const getContextFieldConfiguration = function ({ application, contextName, context, onReceiveCommand }: {
  application: Application;
  context: ContextDefinition;
  contextName: string;
  onReceiveCommand: OnReceiveCommand;
}): GraphQLFieldConfig<any, ResolverContext> {
  const contextObjectTypeFields: GraphQLFieldConfigMap<{ contextIdentifier: ContextIdentifier }, ResolverContext> = {};

  for (const [ aggregateName, aggregate ] of Object.entries(context)) {
    contextObjectTypeFields[aggregateName] = getAggregateFieldConfiguration({
      application,
      contextName,
      aggregate,
      aggregateName,
      onReceiveCommand
    });
  }

  return {
    type: new GraphQLObjectType({
      name: contextName,
      fields: contextObjectTypeFields
    }),
    resolve (): { contextIdentifier: ContextIdentifier } {
      return { contextIdentifier: { name: contextName }};
    }
  };
};

export { getContextFieldConfiguration };

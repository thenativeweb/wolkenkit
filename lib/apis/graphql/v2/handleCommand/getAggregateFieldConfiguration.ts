import { AggregateDefinition } from '../../../../common/application/AggregateDefinition';
import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { Application } from '../../../../common/application/Application';
import { ContextIdentifier } from '../../../../common/elements/ContextIdentifier';
import { getCommandFieldConfiguration } from './getCommandFieldConfiguration';
import { GraphQLFieldConfigMap } from 'graphql/type/definition';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { ResolverContext } from '../ResolverContext';
import { v4 } from 'uuid';
import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

const getAggregateFieldConfiguration = function ({
  application,
  contextName,
  aggregateName,
  aggregate,
  onReceiveCommand
}: {
  application: Application;
  contextName: string;
  aggregateName: string;
  aggregate: AggregateDefinition;
  onReceiveCommand: OnReceiveCommand;
}): GraphQLFieldConfig<any, ResolverContext> {
  const aggregateFieldConfigurations: GraphQLFieldConfigMap<{ contextIdentifier: ContextIdentifier; aggregateIdentifier: AggregateIdentifier }, ResolverContext> = {};

  for (const [ commandName, commandHandler ] of Object.entries(aggregate.commandHandlers)) {
    aggregateFieldConfigurations[commandName] = getCommandFieldConfiguration({
      application,
      contextName,
      aggregateName,
      commandName,
      commandHandler,
      onReceiveCommand
    });
  }

  return {
    type: new GraphQLObjectType({
      name: `${contextName}_${aggregateName}`,
      fields: aggregateFieldConfigurations
    }),
    args: {
      id: {
        type: GraphQLString
      }
    },
    resolve (source, { id }): { contextIdentifier: ContextIdentifier; aggregateIdentifier: AggregateIdentifier } {
      return {
        ...source,
        aggregateIdentifier: { name: aggregateName, id: id ?? v4() }
      };
    }
  };
};

export { getAggregateFieldConfiguration };

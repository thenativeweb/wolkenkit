import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { getCommandResolver } from './getCommandResolver';
import { IResolverObject } from 'graphql-tools';
import { OnReceiveCommand } from '../../OnReceiveCommand';

const getMutationResolvers = function ({ applicationDefinition, onReceiveCommand }: {
  applicationDefinition: ApplicationDefinition;
  onReceiveCommand: OnReceiveCommand;
}): IResolverObject<any, { clientMetadata: ClientMetadata }> {
  const contextResolvers: IResolverObject<any, { clientMetadata: ClientMetadata }> = {};

  for (const [ contextName, context ] of Object.entries(applicationDefinition.domain)) {
    contextResolvers[contextName] = (): IResolverObject<any, { clientMetadata: ClientMetadata }> => {
      const aggregateResolvers: IResolverObject<any, { clientMetadata: ClientMetadata }> = {};

      for (const [ aggregateName, aggregate ] of Object.entries(context)) {
        aggregateResolvers[aggregateName] = ({ id }): IResolverObject<any, { clientMetadata: ClientMetadata }> => {
          const commandResolvers: IResolverObject<any, { clientMetadata: ClientMetadata }> = {};

          for (const [ commandName ] of Object.entries(aggregate.commandHandlers)) {
            commandResolvers[commandName] = getCommandResolver({
              contextIdentifier: { name: contextName },
              aggregateIdentifier: { name: aggregateName, id },
              commandName,
              applicationDefinition,
              onReceiveCommand
            });
          }

          return commandResolvers;
        };
      }

      return aggregateResolvers;
    };
  }

  return contextResolvers;
};

export { getMutationResolvers };

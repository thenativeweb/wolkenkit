import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { getCommandResolver } from './getCommandResolver';
import { IResolvers } from 'graphql-tools';
import { OnReceiveCommand } from '../../OnReceiveCommand';

const getMutationResolvers = function ({ application, onReceiveCommand }: {
  application: Application;
  onReceiveCommand: OnReceiveCommand;
}): IResolvers<any, { clientMetadata: ClientMetadata }> {
  const contextResolvers: IResolvers<any, { clientMetadata: ClientMetadata }> = {};

  for (const [ contextName, context ] of Object.entries(application.domain)) {
    contextResolvers[contextName] = (): IResolvers<any, { clientMetadata: ClientMetadata }> => {
      const aggregateResolvers: IResolvers<any, { clientMetadata: ClientMetadata }> = {};

      for (const [ aggregateName, aggregate ] of Object.entries(context)) {
        aggregateResolvers[aggregateName] = ({ id }): IResolvers<any, { clientMetadata: ClientMetadata }> => {
          const commandResolvers: IResolvers<any, { clientMetadata: ClientMetadata }> = {};

          for (const [ commandName ] of Object.entries(aggregate.commandHandlers)) {
            commandResolvers[commandName] = getCommandResolver({
              contextIdentifier: { name: contextName },
              aggregateIdentifier: { name: aggregateName, id },
              commandName,
              application,
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

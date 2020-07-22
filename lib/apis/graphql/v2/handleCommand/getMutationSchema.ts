import { Application } from '../../../../common/application/Application';
import { getCancelCommandFieldConfiguration } from './getCancelCommandFieldConfiguration';
import { getSendCommandFieldConfiguration } from './getSendCommandFieldConfiguration';
import { GraphQLObjectType } from 'graphql';
import { OnCancelCommand } from '../../OnCancelCommand';
import { OnReceiveCommand } from '../../OnReceiveCommand';

const getMutationSchema = function ({ application, onReceiveCommand, onCancelCommand }: {
  application: Application;
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
}): GraphQLObjectType {
  return new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      command: getSendCommandFieldConfiguration({ application, onReceiveCommand }),
      cancel: getCancelCommandFieldConfiguration({ application, onCancelCommand })
    }
  });
};

export { getMutationSchema };

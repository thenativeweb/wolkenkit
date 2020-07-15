import { Application } from '../../../common/application/Application';
import { getMutationSchema } from './handleCommand/getMutationSchema';
import { getQuerySchema } from './queryView/getQuerySchema';
import { getSubscriptionSchema } from './observeDomainEvents/getSubscriptionSchema';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { GraphQLBoolean, GraphQLObjectType, GraphQLSchema, GraphQLSchemaConfig } from 'graphql';

const getSchema = function ({ application, handleCommand, observeDomainEvents, queryView }: {
  application: Application;
  handleCommand: false | { onReceiveCommand: OnReceiveCommand; onCancelCommand: OnCancelCommand };
  observeDomainEvents: false | { repository: Repository; webSocketEndpoint: string };
  queryView: boolean;
}): { schema: GraphQLSchema; publishDomainEvent?: PublishDomainEvent } {
  const graphQlSchemaConfig: GraphQLSchemaConfig = {};
  let publishDomainEvent: PublishDomainEvent | undefined;

  if (handleCommand !== false) {
    graphQlSchemaConfig.mutation = getMutationSchema({
      application,
      onReceiveCommand: handleCommand.onReceiveCommand,
      onCancelCommand: handleCommand.onCancelCommand
    });
  }

  if (observeDomainEvents !== false) {
    const subscriptionSchemaParts = getSubscriptionSchema({
      application,
      repository: observeDomainEvents.repository
    });

    graphQlSchemaConfig.subscription = subscriptionSchemaParts.schema;
    // eslint-disable-next-line prefer-destructuring
    publishDomainEvent = subscriptionSchemaParts.publishDomainEvent;
  }

  if (queryView) {
    graphQlSchemaConfig.query = getQuerySchema({
      application
    });
  } else {
    graphQlSchemaConfig.query = new GraphQLObjectType({
      name: 'Query',
      fields: {
        _: {
          type: GraphQLBoolean,
          resolve: (): boolean => false
        }
      }
    });
  }

  const schema = new GraphQLSchema(graphQlSchemaConfig);

  return { schema, publishDomainEvent };
};

export { getSchema };

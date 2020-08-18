import { Application } from '../../../common/application/Application';
import { getMutationSchema } from './handleCommand/getMutationSchema';
import { getSubscriptionSchema as getObserveDomainEventsSubscriptionSchema } from './observeDomainEvents/getSubscriptionSchema';
import { getSubscriptionSchema as getObserveNotificationsSubscriptionSchema } from './observeNotifications/getSubscriptionSchema';
import { getQuerySchema } from './queryView/getQuerySchema';
import { GraphQLFieldConfigMap } from 'graphql/type/definition';
import { Notification } from '../../../common/elements/Notification';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import { GraphQLBoolean, GraphQLObjectType, GraphQLSchema, GraphQLSchemaConfig } from 'graphql';

const getSchema = async function ({
  application,
  handleCommand,
  observeDomainEvents,
  observeNotifications,
  queryView
}: {
  application: Application;
  handleCommand: false | { onReceiveCommand: OnReceiveCommand; onCancelCommand: OnCancelCommand };
  observeDomainEvents: false | { repository: Repository };
  observeNotifications: false | { subscriber: Subscriber<Notification>; channelForNotifications: string };
  queryView: boolean;
}): Promise<{ schema: GraphQLSchema; publishDomainEvent?: PublishDomainEvent }> {
  const graphQlSchemaConfig: GraphQLSchemaConfig = {};
  let publishDomainEvent: PublishDomainEvent | undefined;

  if (handleCommand !== false) {
    graphQlSchemaConfig.mutation = getMutationSchema({
      application,
      onReceiveCommand: handleCommand.onReceiveCommand,
      onCancelCommand: handleCommand.onCancelCommand
    });
  }

  const subscriptionConfiguration = {
    name: 'Subscription',
    fields: {} as GraphQLFieldConfigMap<any, any>
  };

  if (observeDomainEvents) {
    const subscriptionSchemaParts = getObserveDomainEventsSubscriptionSchema({
      application,
      repository: observeDomainEvents.repository
    });

    subscriptionConfiguration.fields.domainEvents = subscriptionSchemaParts.schema;
    ({ publishDomainEvent } = subscriptionSchemaParts);
  }
  if (observeNotifications) {
    subscriptionConfiguration.fields.notifications = await getObserveNotificationsSubscriptionSchema({
      application,
      subscriber: observeNotifications.subscriber,
      channelForNotifications: observeNotifications.channelForNotifications
    });
  }

  graphQlSchemaConfig.subscription = new GraphQLObjectType(subscriptionConfiguration);

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

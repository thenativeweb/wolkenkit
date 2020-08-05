import { ApolloClient } from 'apollo-client';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../../lib/common/utils/test/buildDomainEvent';
import { Client } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { CommandData } from '../../../../../lib/common/elements/CommandData';
import { Client as CommandDispatcherClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { Configuration as CommandDispatcherConfiguration } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/Configuration';
import { configurationDefinition as commandDispatcherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition';
import { CommandWithMetadata } from '../../../../../lib/common/elements/CommandWithMetadata';
import { Configuration as DomainEventStoreConfiguration } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/Configuration';
import { configurationDefinition as domainEventStoreConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/domainEventStore/configurationDefinition';
import { DomainEventWithState } from '../../../../../lib/common/elements/DomainEventWithState';
import fetch from 'node-fetch';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import gql from 'graphql-tag';
import { Configuration as GraphqlConfiguration } from '../../../../../lib/runtimes/microservice/processes/graphql/Configuration';
import { configurationDefinition as graphqlConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/graphql/configurationDefinition';
import { HttpLink } from 'apollo-link-http';
import { Configuration as PublisherConfiguration } from '../../../../../lib/runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/publisher/configurationDefinition';
import { Client as PublishMessageClient } from '../../../../../lib/apis/publishMessage/http/v2/Client';
import { sleep } from '../../../../../lib/common/utils/sleep';
import { SnapshotStrategyConfiguration } from '../../../../../lib/common/domain/SnapshotStrategyConfiguration';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { v4 } from 'uuid';
import { waitForSignals } from 'wait-for-signals';
import { WebSocketLink } from 'apollo-link-ws';
import ws from 'ws';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';

suite('main', function (): void {
  this.timeout(10_000);
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const subscribeMessagesChannel = 'newDomainEvent';

  let commandDispatcherClient: CommandDispatcherClient<CommandWithMetadata<CommandData>>,
      commandDispatcherHealthPort: number,
      commandDispatcherPort: number,
      domainEventStoreHealthPort: number,
      domainEventStorePort: number,
      healthPort: number,
      port: number,
      publisherHealthPort: number,
      publisherPort: number,
      publishMessageClient: PublishMessageClient,
      stopProcess: (() => Promise<void>) | undefined,
      stopProcessCommandDispatcher: (() => Promise<void>) | undefined,
      stopProcessDomainEventStore: (() => Promise<void>) | undefined,
      stopProcessPublisher: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [
      port,
      healthPort,
      commandDispatcherPort,
      commandDispatcherHealthPort,
      domainEventStorePort,
      domainEventStoreHealthPort,
      publisherPort,
      publisherHealthPort
    ] = await getAvailablePorts({ count: 8 });

    const domainEventStoreConfiguration: DomainEventStoreConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: domainEventStoreConfigurationDefinition }),
      port: domainEventStorePort,
      healthPort: domainEventStoreHealthPort
    };

    stopProcessDomainEventStore = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      enableDebugMode: false,
      port: domainEventStoreHealthPort,
      env: toEnvironmentVariables({
        configuration: domainEventStoreConfiguration,
        configurationDefinition: domainEventStoreConfigurationDefinition
      })
    });

    const commandDispatcherConfiguration: CommandDispatcherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: commandDispatcherConfigurationDefinition }),
      applicationDirectory,
      priorityQueueStoreOptions: { type: 'InMemory', expirationTime: 5_000 },
      port: commandDispatcherPort,
      healthPort: commandDispatcherHealthPort
    };

    stopProcessCommandDispatcher = await startProcess({
      runtime: 'microservice',
      name: 'commandDispatcher',
      enableDebugMode: false,
      port: commandDispatcherHealthPort,
      env: toEnvironmentVariables({
        configuration: commandDispatcherConfiguration,
        configurationDefinition: commandDispatcherConfigurationDefinition
      })
    });

    commandDispatcherClient = new CommandDispatcherClient<CommandWithMetadata<CommandData>>({
      port: commandDispatcherPort,
      hostName: 'localhost',
      path: '/await-command/v2',
      protocol: 'http',
      createItemInstance ({ item }): CommandWithMetadata<CommandData> {
        return new CommandWithMetadata(item);
      }
    });

    const publisherConfiguration: PublisherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: publisherConfigurationDefinition }),
      port: publisherPort,
      healthPort: publisherHealthPort
    };

    stopProcessPublisher = await startProcess({
      runtime: 'microservice',
      name: 'publisher',
      enableDebugMode: false,
      port: publisherHealthPort,
      env: toEnvironmentVariables({
        configuration: publisherConfiguration,
        configurationDefinition: publisherConfigurationDefinition
      })
    });

    publishMessageClient = new PublishMessageClient({
      protocol: 'http',
      hostName: 'localhost',
      port: publisherPort,
      path: '/publish/v2'
    });

    const graphqlConfiguration: GraphqlConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition: graphqlConfigurationDefinition }),
      applicationDirectory,
      aeonstoreHostName: 'localhost',
      aeonstorePort: domainEventStorePort,
      enableIntegratedClient: false,
      commandDispatcherHostName: 'localhost',
      commandDispatcherPort,
      commandDispatcherRetries: 5,
      healthPort,
      port,
      subscribeMessagesHostName: 'localhost',
      subscribeMessagesPort: publisherPort,
      subscribeMessagesChannel,
      snapshotStrategy: { name: 'never' } as SnapshotStrategyConfiguration
    };

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'graphql',
      enableDebugMode: false,
      port: healthPort,
      env: toEnvironmentVariables({
        configuration: graphqlConfiguration,
        configurationDefinition: graphqlConfigurationDefinition
      })
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }
    if (stopProcessPublisher) {
      await stopProcessPublisher();
    }
    if (stopProcessCommandDispatcher) {
      await stopProcessCommandDispatcher();
    }
    if (stopProcessDomainEventStore) {
      await stopProcessDomainEventStore();
    }

    stopProcess = undefined;
    stopProcessPublisher = undefined;
    stopProcessCommandDispatcher = undefined;
    stopProcessDomainEventStore = undefined;
  });

  suite('getHealth', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const healthClient = new Client({
        protocol: 'http',
        hostName: 'localhost',
        port: healthPort,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => await healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('graphql', (): void => {
    test('has a command mutation endpoint.', async (): Promise<void> => {
      const link = new HttpLink({
        uri: `http://localhost:${port}/graphql/v2`,
        fetch: fetch as any
      });
      const cache = new InMemoryCache();

      const client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });

      const mutation = gql`
        mutation ($aggregateIdentifier: AggregateIdentifier, $data: SampleContext_sampleAggregate_executeT0!) {
          command {
            sampleContext_sampleAggregate_execute(aggregateIdentifier: $aggregateIdentifier, data: $data) {
              id
            }
          }
        }
      `;

      const result = await client.mutate({
        mutation,
        variables: {
          aggregateIdentifier: {
            id: v4()
          },
          data: {
            strategy: 'succeed'
          }
        }
      });

      assert.that(result?.data?.command.sampleContext_sampleAggregate_execute?.id).is.not.undefined();

      const { item } = await commandDispatcherClient.awaitItem();

      assert.that(item.id).is.equalTo(result.data.command.sampleContext_sampleAggregate_execute.id);
    });

    test('has a subscription endpoint.', async (): Promise<void> => {
      const subscriptionClient = new SubscriptionClient(
        `ws://localhost:${port}/graphql/v2/`,
        {},
        ws
      );
      const link = new WebSocketLink(subscriptionClient);
      const cache = new InMemoryCache();

      const client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });

      const query = gql`
        subscription {
          domainEvents {
            id
          }
        }
      `;

      const observable = client.subscribe({
        query
      });

      const aggregateId = v4();
      const domainEvent = new DomainEventWithState({
        ...buildDomainEvent({
          contextIdentifier: {
            name: 'sampleContext'
          },
          aggregateIdentifier: {
            name: 'sampleAggregate',
            id: aggregateId
          },
          name: 'succeeded',
          data: {},
          metadata: {
            revision: 1,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        }),
        state: {
          previous: { domainEventNames: []},
          next: { domainEventNames: [ 'succeeded' ]}
        }
      });

      const collector = waitForSignals({ count: 1 });

      observable.subscribe(async (): Promise<void> => {
        await collector.signal();
      });

      await sleep({ ms: 100 });

      await publishMessageClient.postMessage({
        channel: subscribeMessagesChannel,
        message: domainEvent
      });

      await collector.promise;
    });

    test('has a query view endpoint.', async (): Promise<void> => {
      const link = new HttpLink({
        uri: `http://localhost:${port}/graphql/v2`,
        fetch: fetch as any
      });
      const cache = new InMemoryCache();

      const client = new ApolloClient<NormalizedCacheObject>({
        link,
        cache
      });

      const query = gql`
        query {
          sampleView {
            all {
              contextIdentifier {
                name
              }
              id
            }
          }
        }
      `;

      const result = await client.query({
        query,
        variables: {
          aggregateId: v4(),
          data: {
            strategy: 'succeed'
          }
        }
      });

      assert.that(result?.data?.sampleView.all).is.equalTo([]);
    });
  });
});

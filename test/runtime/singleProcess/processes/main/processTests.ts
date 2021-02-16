import { Agent } from 'http';
import { AggregateIdentifier } from '../../../../../lib/common/elements/AggregateIdentifier';
import { ApolloClient } from 'apollo-client';
import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildCommand } from '../../../../../lib/common/utils/test/buildCommand';
import { Configuration } from '../../../../../lib/runtimes/singleProcess/processes/main/Configuration';
import { configurationDefinition } from '../../../../../lib/runtimes/singleProcess/processes/main/configurationDefinition';
import { CustomError } from 'defekt';
import { errors } from '../../../../../lib/common/errors';
import fetch from 'node-fetch';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getSocketPaths } from '../../../../shared/getSocketPaths';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import gql from 'graphql-tag';
import { Client as HandleCommandClient } from '../../../../../lib/apis/handleCommand/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { HttpLink } from 'apollo-link-http';
import { Client as ManageFileClient } from '../../../../../lib/apis/manageFile/http/v2/Client';
import { Client as ObserveDomainEventsClient } from '../../../../../lib/apis/observeDomainEvents/http/v2/Client';
import path from 'path';
import { Client as QueryViewsClient } from '../../../../../lib/apis/queryView/http/v2/Client';
import { Readable } from 'stream';
import { sleep } from '../../../../../lib/common/utils/sleep';
import { SnapshotStrategyConfiguration } from '../../../../../lib/common/domain/SnapshotStrategyConfiguration';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import streamToString from 'stream-to-string';
import { Client as SubscribeNotificationsClient } from '../../../../../lib/apis/subscribeNotifications/http/v2/Client';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { v4 } from 'uuid';
import { waitForSignals } from 'wait-for-signals';
import { WebSocketLink } from 'apollo-link-ws';
import ws from 'ws';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('main process', function (): void {
  this.timeout(60_000);
  const applicationDirectory = getTestApplicationDirectory({ name: 'withComplexFlow', language: 'javascript' });

  let agent: Agent,
      handleCommandClient: HandleCommandClient,
      healthSocket: string,
      manageFileClient: ManageFileClient,
      observeDomainEventsClient: ObserveDomainEventsClient,
      queryViewsClient: QueryViewsClient,
      socket: string,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ socket, healthSocket ] = await getSocketPaths({ count: 2 });

    const configuration: Configuration = {
      ...getDefaultConfiguration({
        configurationDefinition
      }),
      applicationDirectory,
      domainEventStoreOptions: { type: 'InMemory' },
      graphqlApi: { enableIntegratedClient: false },
      httpApi: true,
      identityProviders: [{ issuer: 'https://token.invalid', certificate: certificateDirectory }],
      portOrSocket: socket,
      healthPortOrSocket: healthSocket,
      snapshotStrategy: { name: 'never' } as SnapshotStrategyConfiguration
    };

    stopProcess = await startProcess({
      runtime: 'singleProcess',
      name: 'main',
      enableDebugMode: false,
      portOrSocket: healthSocket,
      env: toEnvironmentVariables({
        configuration,
        configurationDefinition
      })
    });

    handleCommandClient = new HandleCommandClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
      path: '/command/v2'
    });

    observeDomainEventsClient = new ObserveDomainEventsClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
      path: '/domain-events/v2'
    });

    queryViewsClient = new QueryViewsClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
      path: '/views/v2'
    });

    manageFileClient = new ManageFileClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
      path: '/files/v2'
    });

    // The parameter socketPath is necessary for the agent to connect to a
    // unix socket. It is neither document in the node docs nor port of the
    // @types/node package. Relevant issues:
    // https://github.com/node-fetch/node-fetch/issues/336#issuecomment-689623290
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/36463
    agent = new Agent({ socketPath: socket } as any);
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }

    stopProcess = undefined;
  });

  suite('getHealth', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const healthClient = new HealthClient({
        protocol: 'http',
        hostName: 'localhost',
        portOrSocket: healthSocket,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => await healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('command handling', (): void => {
    test('handles commands and publishes events.', async (): Promise<void> => {
      const aggregateIdentifier: AggregateIdentifier = {
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: v4()
        }
      };
      const command = buildCommand({
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      const eventStream = await observeDomainEventsClient.getDomainEvents({});

      await handleCommandClient.postCommand({ command });

      await new Promise<void>((resolve, reject): void => {
        eventStream.on('error', (err: any): void => {
          reject(err);
        });
        eventStream.on('close', (): void => {
          resolve();
        });
        eventStream.pipe(asJsonStream(
          [
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            },
            (): void => {
              reject(new Error('Should only have received twe messages.'));
            }
          ],
          true
        ));
      });
    });

    test('executes flows.', async (): Promise<void> => {
      const aggregateIdentifier: AggregateIdentifier = {
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: v4()
        }
      };
      const command = buildCommand({
        aggregateIdentifier,
        name: 'triggerFlow',
        data: {
          flowNames: [ 'neverFlow' ]
        }
      });

      const eventStream = await observeDomainEventsClient.getDomainEvents({});

      await handleCommandClient.postCommand({ command });

      const counter = waitForSignals({ count: 2 });

      eventStream.on('error', async (err: any): Promise<void> => {
        await counter.fail(err);
      });
      eventStream.pipe(asJsonStream(
        [
          async (data): Promise<void> => {
            try {
              assert.that(data).is.atLeast({
                aggregateIdentifier,
                name: 'triggeredFlow',
                data: { flowName: 'neverFlow' }
              });
              await counter.signal();
            } catch (ex: unknown) {
              await counter.fail(ex);
            }
          },
          async (data): Promise<void> => {
            try {
              assert.that(data).is.atLeast({
                aggregateIdentifier,
                name: 'executedFromFlow',
                data: {
                  basedOnRevision: 1,
                  fromFlow: 'neverFlow'
                }
              });
              await counter.signal();
            } catch (ex: unknown) {
              await counter.fail(ex);
            }
          },
          async (): Promise<void> => {
            await counter.fail(new Error('Should only have received two messages.'));
          }
        ],
        true
      ));

      await counter.promise;
    });
  });

  suite('graphql', (): void => {
    test('has a command mutation endpoint.', async (): Promise<void> => {
      const link = new HttpLink({
        uri: `http://localhost/graphql/v2/`,
        fetch: fetch as any,
        fetchOptions: { agent }
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

      assert.that(result.data?.command.sampleContext_sampleAggregate_execute?.id).is.not.undefined();
    });

    test('has a subscription endpoint for domain events.', async (): Promise<void> => {
      const subscriptionClient = new SubscriptionClient(
        `ws+unix://${socket}:/graphql/v2/`,
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
      const command = buildCommand({
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
        },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      const collector = waitForSignals({ count: 2 });

      observable.subscribe(async (): Promise<void> => {
        await collector.signal();
      });

      await sleep({ ms: 100 });

      await handleCommandClient.postCommand({ command });

      await collector.promise;
    });

    test('has a subscription endpoint for notifications.', async (): Promise<void> => {
      const subscriptionClient = new SubscriptionClient(
        `ws+unix://${socket}:/graphql/v2/`,
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
          notifications {
            name
          }
        }
      `;

      const observable = client.subscribe({
        query
      });

      const aggregateId = v4();
      const command = buildCommand({
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: aggregateId }
        },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      const collector = waitForSignals({ count: 1 });

      observable.subscribe(async (): Promise<void> => {
        await collector.signal();
      });

      await sleep({ ms: 100 });

      await handleCommandClient.postCommand({ command });

      await collector.promise;
    });
  });

  suite('views', (): void => {
    test('runs queries against the views.', async (): Promise<void> => {
      const aggregateIdentifier: AggregateIdentifier = {
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: v4()
        }
      };
      const command = buildCommand({
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      await handleCommandClient.postCommand({ command });

      await sleep({ ms: 500 });

      const resultStream = await queryViewsClient.queryStream({
        viewName: 'sampleView',
        queryName: 'all'
      });
      const resultItems = [];

      for await (const resultItem of resultStream) {
        resultItems.push(resultItem);
      }

      assert.that(resultItems.length).is.equalTo(1);
      assert.that(resultItems[0]).is.atLeast({
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate' }
        },
        name: 'executed'
      });
    });
  });

  suite('files', (): void => {
    test('stores files.', async (): Promise<void> => {
      const file = {
        id: v4(),
        name: v4(),
        content: 'Hello world!'
      };

      await manageFileClient.addFile({
        id: file.id,
        name: file.name,
        contentType: 'text/plain',
        stream: Readable.from(file.content)
      });

      const { stream } = await manageFileClient.getFile({ id: file.id });
      const content = await streamToString(stream);

      assert.that(content).is.equalTo(file.content);
    });

    test('removes files.', async (): Promise<void> => {
      const file = {
        id: v4(),
        name: v4(),
        content: 'Hello world!'
      };

      await manageFileClient.addFile({
        id: file.id,
        name: file.name,
        contentType: 'text/plain',
        stream: Readable.from(file.content)
      });

      await manageFileClient.removeFile({ id: file.id });

      await assert.that(async (): Promise<void> => {
        await manageFileClient.getFile({ id: file.id });
      }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.FileNotFound.code);
    });
  });

  suite('notifications', (): void => {
    test('publishes notifications via the api.', async (): Promise<void> => {
      const notificationsClient = new SubscribeNotificationsClient({
        protocol: 'http',
        hostName: 'localhost',
        portOrSocket: socket,
        path: '/notifications/v2'
      });

      const notificationStream = await notificationsClient.getNotifications();

      const counter = waitForSignals({ count: 2 });

      notificationStream.on('error', async (err: any): Promise<void> => {
        await counter.fail(err);
      });
      notificationStream.pipe(asJsonStream(
        [
          async (data): Promise<void> => {
            try {
              assert.that(data).is.atLeast({
                name: 'flowSampleFlowUpdated',
                data: {}
              });
              await counter.signal();
            } catch (ex: unknown) {
              await counter.fail(ex);
            }
          },
          async (data): Promise<void> => {
            try {
              assert.that(data).is.atLeast({
                name: 'viewSampleViewUpdated',
                data: {}
              });
              await counter.signal();
            } catch (ex: unknown) {
              await counter.fail(ex);
            }
          },
          async (): Promise<void> => {
            await counter.fail(new Error('Should only have received two messages.'));
          }
        ],
        true
      ));

      const aggregateIdentifier: AggregateIdentifier = {
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: v4()
        }
      };
      const command = buildCommand({
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      await handleCommandClient.postCommand({ command });

      await counter.promise;
    });
  });
});

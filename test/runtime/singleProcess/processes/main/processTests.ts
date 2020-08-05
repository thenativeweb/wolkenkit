import { ApolloClient } from 'apollo-client';
import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildCommand } from '../../../../../lib/common/utils/test/buildCommand';
import { Client } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Configuration } from '../../../../../lib/runtimes/singleProcess/processes/main/Configuration';
import { configurationDefinition } from '../../../../../lib/runtimes/singleProcess/processes/main/configurationDefinition';
import { CustomError } from 'defekt';
import { errors } from '../../../../../lib/common/errors';
import fetch from 'node-fetch';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import gql from 'graphql-tag';
import { Client as HandleCommandClient } from '../../../../../lib/apis/handleCommand/http/v2/Client';
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
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { v4 } from 'uuid';
import { waitForSignals } from 'wait-for-signals';
import { WebSocketLink } from 'apollo-link-ws';
import ws from 'ws';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('main', function (): void {
  this.timeout(10_000);
  const applicationDirectory = getTestApplicationDirectory({ name: 'withComplexFlow', language: 'javascript' });

  let handleCommandClient: HandleCommandClient,
      healthPort: number,
      manageFileClient: ManageFileClient,
      observeDomainEventsClient: ObserveDomainEventsClient,
      port: number,
      queryViewsClient: QueryViewsClient,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ port, healthPort ] = await getAvailablePorts({ count: 2 });

    const configuration: Configuration = {
      ...getDefaultConfiguration({
        configurationDefinition
      }),
      applicationDirectory,
      domainEventStoreOptions: { type: 'InMemory' },
      graphqlApi: { enableIntegratedClient: false },
      httpApi: true,
      identityProviders: [{ issuer: 'https://token.invalid', certificate: certificateDirectory }],
      port,
      healthPort,
      snapshotStrategy: { name: 'never' } as SnapshotStrategyConfiguration
    };

    stopProcess = await startProcess({
      runtime: 'singleProcess',
      name: 'main',
      enableDebugMode: false,
      port: healthPort,
      env: toEnvironmentVariables({
        configuration,
        configurationDefinition
      })
    });

    handleCommandClient = new HandleCommandClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/command/v2'
    });

    observeDomainEventsClient = new ObserveDomainEventsClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/domain-events/v2'
    });

    queryViewsClient = new QueryViewsClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/views/v2'
    });

    manageFileClient = new ManageFileClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/files/v2'
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }

    stopProcess = undefined;
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

  suite('command handling', (): void => {
    test('handles commands and publishes events.', async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: v4()
      };
      const command = buildCommand({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      const eventStream = await observeDomainEventsClient.getDomainEvents({});

      await handleCommandClient.postCommand({ command });

      await new Promise((resolve, reject): void => {
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
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier,
                  name: 'succeeded',
                  data: {}
                });
                resolve();
              } catch (ex) {
                reject(ex);
              }
            },
            (data): void => {
              try {
                assert.that(data).is.atLeast({
                  contextIdentifier: {
                    name: 'sampleContext'
                  },
                  aggregateIdentifier,
                  name: 'executed',
                  data: {
                    strategy: 'succeed'
                  }
                });
                resolve();
              } catch (ex) {
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
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: v4()
      };
      const command = buildCommand({
        contextIdentifier: {
          name: 'sampleContext'
        },
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
                contextIdentifier: { name: 'sampleContext' },
                aggregateIdentifier,
                name: 'triggeredFlow',
                data: { flowName: 'neverFlow' }
              });
              await counter.signal();
            } catch (ex) {
              await counter.fail(ex);
            }
          },
          async (data): Promise<void> => {
            try {
              assert.that(data).is.atLeast({
                contextIdentifier: { name: 'sampleContext' },
                aggregateIdentifier,
                name: 'executedFromFlow',
                data: {
                  basedOnRevision: 1,
                  flowName: 'neverFlow'
                }
              });
              await counter.signal();
            } catch (ex) {
              await counter.fail(ex);
            }
          },
          async (): Promise<void> => {
            await counter.fail(new Error('Should only have received two messages.'));
          }
        ],
        true
      ));
    });
  });

  suite('graphql', (): void => {
    test('has a command mutation endpoint.', async (): Promise<void> => {
      const link = new HttpLink({
        uri: `http://localhost:${port}/graphql/v2/`,
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
      const command = buildCommand({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
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
  });

  suite('views', (): void => {
    test('runs queries against the views.', async (): Promise<void> => {
      const aggregateIdentifier = {
        name: 'sampleAggregate',
        id: v4()
      };
      const command = buildCommand({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier,
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      await handleCommandClient.postCommand({ command });

      await sleep({ ms: 500 });

      const resultStream = await queryViewsClient.query({
        viewName: 'sampleView',
        queryName: 'all'
      });
      const resultItems = [];

      for await (const resultItem of resultStream) {
        resultItems.push(resultItem);
      }

      assert.that(resultItems.length).is.equalTo(1);
      assert.that(resultItems[0]).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate' },
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
});

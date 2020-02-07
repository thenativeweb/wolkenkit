import { asJsonStream } from '../../../../shared/http/asJsonStream';
import { assert } from 'assertthat';
import { buildCommand } from '../../../../shared/buildCommand';
import { Client } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { getAvailablePort } from '../../../../../lib/common/utils/network/getAvailablePort';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleCommandClient } from '../../../../../lib/apis/handleCommand/http/v2/Client';
import { Client as ObserveDomainEventsClient } from '../../../../../lib/apis/observeDomainEvents/http/v2/Client';
import path from 'path';
import { startProcess } from '../../../../shared/runtime/startProcess';
import { uuid } from 'uuidv4';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite.only('main', function (): void {
  this.timeout(10_000);
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let handleCommandClient: HandleCommandClient,
      observeDomainEventsClient: ObserveDomainEventsClient,
      port: number,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    port = await getAvailablePort();

    stopProcess = await startProcess({
      runtime: 'singleProcess',
      name: 'main',
      port,
      env: {
        APPLICATION_DIRECTORY: applicationDirectory,
        HEALTH_CORS_ORIGIN: '*',
        COMMAND_CORS_ORIGIN: '*',
        DOMAIN_EVENT_CORS_ORIGIN: '*',
        DOMAIN_EVENT_STORE_TYPE: 'InMemory',
        IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`,
        PORT: String(port)
      }
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
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }

    stopProcess = undefined;
  });

  suite('GET /health/v2', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const healthClient = new Client({
        protocol: 'http',
        hostName: 'localhost',
        port,
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
        id: uuid()
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
  });
});

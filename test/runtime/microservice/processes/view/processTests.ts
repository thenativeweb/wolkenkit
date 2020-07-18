import { assert } from 'assertthat';
import { Configuration } from '../../../../../lib/runtimes/microservice/processes/view/Configuration';
import { configurationDefinition } from '../../../../../lib/runtimes/microservice/processes/view/configurationDefinition';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as QueryViewsClient } from '../../../../../lib/apis/queryView/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';

suite('view', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'withHardcodedViews', language: 'javascript' });

  let healthPort: number,
      port: number,
      queryViewsClient: QueryViewsClient,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ healthPort, port ] = await getAvailablePorts({ count: 2 });

    const configuration: Configuration = {
      ...getDefaultConfiguration({ configurationDefinition }),
      applicationDirectory,
      healthPort,
      port
    };

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'view',
      enableDebugMode: false,
      port: healthPort,
      env: toEnvironmentVariables({
        configuration,
        configurationDefinition
      })
    });

    queryViewsClient = new QueryViewsClient({
      protocol: 'http',
      hostName: 'localhost',
      port,
      path: '/views/v2'
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
      const healthClient = new HealthClient({
        protocol: 'http',
        hostName: 'localhost',
        port: healthPort,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('views', (): void => {
    test('queries the views.', async (): Promise<void> => {
      const resultStream = await queryViewsClient.query({
        viewName: 'sampleView',
        queryName: 'hardcoded'
      });
      const resultItems = [];

      for await (const resultItem of resultStream) {
        resultItems.push(resultItem);
      }

      assert.that(resultItems).is.equalTo([
        { value: 'foo' },
        { value: 'bar' },
        { value: 'baz' }
      ]);
    });
  });
});

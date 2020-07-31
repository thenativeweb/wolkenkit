import { assert } from 'assertthat';
import { Configuration } from '../../../../../lib/runtimes/microservice/processes/view/Configuration';
import { configurationDefinition } from '../../../../../lib/runtimes/microservice/processes/view/configurationDefinition';
import { CustomError } from 'defekt';
import { errors } from '../../../../../lib/common/errors';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { Client as ManageFileClient } from '../../../../../lib/apis/manageFile/http/v2/Client';
import { Readable } from 'stream';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import streamToString from 'stream-to-string';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { v4 } from 'uuid';

suite('file', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

  let healthPort: number,
      manageFileClient: ManageFileClient,
      port: number,
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
      name: 'file',
      enableDebugMode: false,
      port: healthPort,
      env: toEnvironmentVariables({
        configuration,
        configurationDefinition
      })
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

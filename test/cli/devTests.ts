import { assert } from 'assertthat';
import axios from 'axios';
import { getAvailablePorts } from '../../lib/common/utils/network/getAvailablePorts';
import { isolated } from 'isolated';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import shell from 'shelljs';

const appName = 'test-app';
const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('dev', function (): void {
  this.timeout(30_000);

  test('starts the application.', async (): Promise<void> => {
    const appDirectory = path.join(await isolated(), appName);
    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    shell.exec(initCommand);

    const [ port, healthPort ] = await getAvailablePorts({ count: 2 });
    const devCommand = `node ${cliPath} --verbose dev --port ${port} --health-port ${healthPort}`;

    const childProcess = shell.exec(devCommand, {
      cwd: appDirectory,
      async: true
    });

    await assert.that(async (): Promise<void> => {
      await retry(async (): Promise<void> => {
        await axios({
          method: 'get',
          url: `http://localhost:${healthPort}/health/v2`,
          validateStatus: (status): boolean => status === 200
        });
      }, { minTimeout: 500, maxTimeout: 500, retries: 20 });
    }).is.not.throwingAsync();

    childProcess.kill();
  });
});

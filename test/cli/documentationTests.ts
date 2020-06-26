import { assert } from 'assertthat';
import axios from 'axios';
import { getAvailablePort } from '../../lib/common/utils/network/getAvailablePort';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import shell from 'shelljs';

const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('documentation', function (): void {
  this.timeout(30_000);

  test('starts the documentation.', async (): Promise<void> => {
    const port = await getAvailablePort();
    const documentationCommand = `node ${cliPath} --verbose documentation --port ${port}`;

    const childProcess = shell.exec(documentationCommand, { async: true });

    await assert.that(async (): Promise<void> => {
      await retry(async (): Promise<void> => {
        await axios({
          method: 'get',
          url: `http://localhost:${port}/`,
          validateStatus: (status): boolean => status === 200
        });
      }, { minTimeout: 100, maxTimeout: 100, retries: 20 });
    }).is.not.throwingAsync();

    childProcess.kill();
  });
});

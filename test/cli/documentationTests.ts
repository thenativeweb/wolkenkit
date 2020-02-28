import { assert } from 'assertthat';
import axios from 'axios';
import { getAvailablePort } from '../../lib/common/utils/network/getAvailablePort';
import path from 'path';
import shell from 'shelljs';
import { sleep } from '../../lib/common/utils/sleep';

const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('documentation', function (): void {
  this.timeout(30_000);

  test('starts the documentation.', async (): Promise<void> => {
    const port = await getAvailablePort();
    const documentationCommand = `node ${cliPath} documentation --port ${port}`;

    const childProcess = shell.exec(documentationCommand, { async: true });

    await sleep({ ms: 2000 });

    await assert.that(async (): Promise<void> => {
      await axios({
        method: 'get',
        url: `http://localhost:${port}/`,
        validateStatus: (status): boolean => status === 200
      });
    }).is.not.throwingAsync();

    childProcess.kill();
  });
});

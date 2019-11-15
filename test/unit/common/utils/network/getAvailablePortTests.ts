import { assert } from 'assertthat';
import { getAvailablePort } from '../../../../../lib/common/utils/network/getAvailablePort';
import http from 'http';
import { sleep } from '../../../../../lib/common/utils/sleep';

suite('getAvailablePort', (): void => {
  test('returns an available port.', async (): Promise<void> => {
    const server = http.createServer((_req, res): void => {
      res.end();
    });

    const availablePort = await getAvailablePort();

    let isPortInUse = false;

    server.on('error', (): void => {
      isPortInUse = true;
    });

    await new Promise((resolve): void => {
      server.listen(availablePort, (): void => {
        resolve();
      });
    });

    await sleep({ ms: 50 });

    assert.that(isPortInUse).is.false();
  });

  test('returns an available port that is not in use.', async (): Promise<void> => {
    const server = http.createServer((_req, res): void => {
      res.end();
    });

    const availablePortFirst = await getAvailablePort();

    await new Promise((resolve): void => {
      server.listen(availablePortFirst, (): void => {
        resolve();
      });
    });

    await sleep({ ms: 50 });

    const availablePortSecond = await getAvailablePort();

    assert.that(availablePortSecond).is.not.equalTo(availablePortFirst);
  });
});

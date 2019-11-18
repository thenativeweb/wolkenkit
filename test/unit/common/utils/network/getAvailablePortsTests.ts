import { assert } from 'assertthat';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import http from 'http';
import { sleep } from '../../../../../lib/common/utils/sleep';
import { uniq } from 'lodash';

suite('getAvailablePorts', (): void => {
  test('returns a list of distinct ports.', async (): Promise<void> => {
    const availablePorts = await getAvailablePorts({ count: 10 });

    assert.that(uniq(availablePorts)).is.equalTo(availablePorts);
  });

  test('returns a list of distinct ports even with a pause in-between.', async (): Promise<void> => {
    const firstAvailablePorts = await getAvailablePorts({ count: 10 });

    await sleep({ ms: 100 });

    const secondAvailablePorts = await getAvailablePorts({ count: 10 });
    const availablePorts = [ ...firstAvailablePorts, ...secondAvailablePorts ];

    assert.that(uniq(availablePorts)).is.equalTo(availablePorts);
  });

  test('returns a list of available ports.', async (): Promise<void> => {
    const firstServer = http.createServer((_req, res): void => {
      res.end();
    });
    const secondServer = http.createServer((_req, res): void => {
      res.end();
    });

    const [ firstPort, secondPort ] = await getAvailablePorts({ count: 2 });

    let isFirstPortInUse = false,
        isSecondPortInUse = false;

    firstServer.on('error', (): void => {
      isFirstPortInUse = true;
    });
    secondServer.on('error', (): void => {
      isSecondPortInUse = true;
    });

    await new Promise((resolve): void => {
      firstServer.listen(firstPort, (): void => {
        resolve();
      });
    });
    await new Promise((resolve): void => {
      secondServer.listen(secondPort, (): void => {
        resolve();
      });
    });

    await sleep({ ms: 50 });

    assert.that(isFirstPortInUse).is.false();
    assert.that(isSecondPortInUse).is.false();
  });

  test('returns a list of available port that are not in use.', async (): Promise<void> => {
    const firstServer = http.createServer((_req, res): void => {
      res.end();
    });
    const secondServer = http.createServer((_req, res): void => {
      res.end();
    });

    const [ firstPort, secondPort ] = await getAvailablePorts({ count: 2 });

    await new Promise((resolve): void => {
      firstServer.listen(firstPort, (): void => {
        resolve();
      });
    });
    await new Promise((resolve): void => {
      secondServer.listen(secondPort, (): void => {
        resolve();
      });
    });

    await sleep({ ms: 50 });

    const otherAvailablePorts = await getAvailablePorts({ count: 2 });

    assert.that(otherAvailablePorts.includes(firstPort)).is.false();
    assert.that(otherAvailablePorts.includes(secondPort)).is.false();
  });
});

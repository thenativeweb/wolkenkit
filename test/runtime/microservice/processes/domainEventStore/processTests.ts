import { assert } from 'assertthat';
import axios from 'axios';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { startProcess } from '../../../../shared/runtime/startProcess';

suite('domain event store', (): void => {
  let port: number,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ port ] = await getAvailablePorts({ count: 1 });

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'domainEventStore',
      port,
      env: {
        PORT: String(port)
      }
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
      const { status } = await axios({
        method: 'get',
        url: `http://localhost:${port}/health/v2`
      });

      assert.that(status).is.equalTo(200);
    });
  });

  suite('query side', (): void => {
    suite('GET /query/v2/replay', (): void => {

    });

    suite('GET /query/v2/replay/:aggregateId', (): void => {

    });

    suite('GET /query/v2/last-domain-event', (): void => {

    });

    suite('GET /query/v2/snapshot', (): void => {

    });
  });

  suite('write side', (): void => {
    suite('GET /write/v2/store-domain-events', (): void => {

    });

    suite('GET /write/v2/store-snapshot', (): void => {

    });
  });
});

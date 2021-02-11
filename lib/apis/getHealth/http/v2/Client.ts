import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

class Client extends HttpClient {
  public constructor ({ protocol = 'http', hostName, portOrSocket, path = '/' }: {
    protocol?: string;
    hostName: string;
    portOrSocket: number | string;
    path?: string;
  }) {
    super({ protocol, hostName, portOrSocket, path });
  }

  public async getHealth (): Promise<{
    host: { architecture: string; platform: string };
    node: { version: string };
    process: { id: number; uptime: number };
    cpuUsage: { user: number; system: number };
    memoryUsage: { rss: number; maxRss: number; heapTotal: number; heapUsed: number; external: number };
    diskUsage: { read: number; write: number };
  }> {
    const { status, data } = await this.axios({
      method: 'get',
      url: `${this.url}/`
    });

    if (status !== 200) {
      logger.error(
        'An unknown error occured.',
        withLogMetadata('api', 'getHealth', { err: data, status })
      );

      throw new errors.UnknownError();
    }

    return data;
  }
}

export { Client };

import axios from 'axios';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';

const logger = flaschenpost.getLogger();

class Client extends HttpClient {
  public constructor ({ protocol = 'http', hostName, port, path = '/' }: {
    protocol?: string;
    hostName: string;
    port: number;
    path?: string;
  }) {
    super({ protocol, hostName, port, path });
  }

  public async getHealth (): Promise<{
    host: { architecture: string; platform: string };
    node: { version: string };
    process: { id: number; uptime: number };
    cpuUsage: { user: number; system: number };
    memoryUsage: { rss: number; maxRss: number; heapTotal: number; heapUsed: number; external: number };
    diskUsage: { read: number; write: number };
  }> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/`,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { ex: data, status });

      throw new errors.UnknownError();
    }

    return data;
  }
}

export { Client };

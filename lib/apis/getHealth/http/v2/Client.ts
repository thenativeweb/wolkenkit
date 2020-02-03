import axios from 'axios';
import { HttpClient } from '../../../shared/HttpClient';

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
    const { data } = await axios({
      method: 'get',
      url: `${this.url}/`,
      validateStatus (): boolean {
        return true;
      }
    });

    return data;
  }
}

export { Client };

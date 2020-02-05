import axios from 'axios';
import { errors } from '../../../../common/errors';
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

  public async postMessage ({ message }: {
    message: object;
  }): Promise<void> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/`,
      data: message,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      default: {
        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };

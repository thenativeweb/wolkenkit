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

  public async postMessage ({ channel, message }: {
    channel: string;
    message: object;
  }): Promise<void> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/`,
      data: { channel, message }
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      default: {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api-client', 'publishMessage', { err: data, status })
        );

        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };

import { errors } from '../../../../common/errors';
import { FilterHeartbeatsTransform } from '../../../../common/utils/http/FilterHeartbeatsTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { ParseJsonTransform } from '../../../../common/utils/http/ParseJsonTransform';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { PassThrough, pipeline } from 'stream';

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

  public async getMessages ({ channel }: {
    channel: string;
  }): Promise<PassThrough> {
    const { data, status } = await this.axios({
      method: 'get',
      url: `${this.url}/${channel}`,
      responseType: 'stream'
    });

    if (status !== 200) {
      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const jsonParser = new ParseJsonTransform();
    const heartbeatFilter = new FilterHeartbeatsTransform();

    return pipeline(
      data,
      jsonParser,
      heartbeatFilter,
      passThrough,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error(
            'An error occured during stream piping.',
            withLogMetadata('api-client', 'subscribeMessages', { err })
          );
        }
      }
    );
  }
}

export { Client };

import { errors } from '../../../../common/errors';
import { FilterHeartbeatsTransform } from '../../../../common/utils/http/FilterHeartbeatsTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { NotificationsDescription } from '../../../../common/application/NotificationsDescription';
import { ParseJsonTransform } from '../../../../common/utils/http/ParseJsonTransform';
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

  public async getDescription (): Promise<NotificationsDescription> {
    const { data, status } = await this.axios({
      method: 'get',
      url: `${this.url}/description`
    });

    if (status === 200) {
      return data;
    }

    logger.error('An unknown error occured.', { ex: data, status });

    throw new errors.UnknownError();
  }

  public async getNotifications (): Promise<PassThrough> {
    const { data, status } = await this.axios({
      method: 'get',
      url: `${this.url}/`,
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
          logger.error('An error occured during stream piping.', { err });
        }
      }
    );
  }
}

export { Client };

import axios from 'axios';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsFromJsonStreamTransform } from '../../../../common/utils/http/FilterHeartbeatsFromJsonStreamTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { PassThrough, pipeline } from 'stream';

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

  public async getMessages (): Promise<PassThrough> {
    const { data, status } = await axios({
      method: 'get',
      url: this.url,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      throw new errors.UnknownError(data.message);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartbeatsFromJsonStreamTransform();

    return pipeline(
      data,
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

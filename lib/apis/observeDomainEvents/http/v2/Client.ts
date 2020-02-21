import axios from 'axios';
import { DomainEventDescription } from '../../../../common/application/DomainEventDescription';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsFromJsonStreamTransform } from '../../../../common/utils/http/FilterHeartbeatsFromJsonStreamTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import qs from 'qs';
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

  public async getDescription (): Promise<Record<string, Record<string, Record<string, DomainEventDescription>>>> {
    const { data, status } = await axios({
      method: 'get',
      url: `${this.url}/description`,
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return data;
    }

    logger.error('An unknown error occured.', { ex: data, status });

    throw new errors.UnknownError();
  }

  public async getDomainEvents ({ filter = {}}: {
    filter?: object;
  }): Promise<PassThrough> {
    const { data, status } = await axios({
      method: 'get',
      url: this.url,
      params: filter,
      paramsSerializer (params): string {
        return qs.stringify(params);
      },
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status !== 200) {
      logger.error('An unknown error occured.', { ex: data, status });

      throw new errors.UnknownError();
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

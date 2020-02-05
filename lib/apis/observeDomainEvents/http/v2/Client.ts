import axios from 'axios';
import { DomainEventDescription } from '../../../../common/application/DomainEventDescription';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsFromJsonStreamTransform } from '../../../../common/utils/http/FilterHeartbeatsFromJsonStreamTransform';
import { HttpClient } from '../../../shared/HttpClient';
import qs from 'qs';
import { PassThrough, pipeline } from 'stream';

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

    throw new errors.UnknownError(data.message);
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
          throw err;
        }
      }
    );
  }
}

export { Client };

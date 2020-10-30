import axios from 'axios';
import { DomainEventDescription } from '../../../../common/application/DomainEventDescription';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsTransform } from '../../../../common/utils/http/FilterHeartbeatsTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { ParseJsonTransform } from '../../../../common/utils/http/ParseJsonTransform';
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
    filter?: Record<string, unknown>;
  }): Promise<PassThrough> {
    const { data, status } = await axios({
      method: 'get',
      url: this.url,
      params: { filter },
      paramsSerializer (params): string {
        return Object.entries(params).
          map(([ key, value ]): string => `${key}=${JSON.stringify(value)}`).
          join('&');
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

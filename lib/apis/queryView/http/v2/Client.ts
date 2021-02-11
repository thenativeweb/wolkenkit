import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { ParseJsonTransform } from '../../../../common/utils/http/ParseJsonTransform';
import { QueryDescription } from '../../../../common/application/QueryDescription';
import { QueryResultItem } from '../../../../common/elements/QueryResultItem';
import streamToString from 'stream-to-string';
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

  public async getDescription (): Promise<Record<string, Record<string, QueryDescription>>> {
    const { data, status } = await this.axios({
      method: 'get',
      url: `${this.url}/description`
    });

    if (status === 200) {
      return data;
    }

    logger.error(
      'An unknown error occured.',
      withLogMetadata('api-client', 'queryView', { err: data, status })
    );

    throw new errors.UnknownError();
  }

  public async queryStream ({ viewName, queryName, queryOptions = {}}: {
    viewName: string;
    queryName: string;
    queryOptions?: Record<string, unknown>;
  }): Promise<PassThrough> {
    const { data, status } = await this.axios({
      method: 'get',
      url: `${this.url}/${viewName}/stream/${queryName}`,
      params: queryOptions,
      paramsSerializer (params): string {
        return Object.entries(params).
          map(([ key, value ]): string => `${key}=${JSON.stringify(value)}`).
          join('&');
      },
      responseType: 'stream'
    });

    if (status !== 200) {
      const error = JSON.parse(await streamToString(data));

      switch (error.code) {
        case errors.ViewNotFound.code: {
          throw new errors.ViewNotFound(error.message);
        }
        case errors.QueryHandlerNotFound.code: {
          throw new errors.QueryHandlerNotFound(error.message);
        }
        case errors.QueryOptionsInvalid.code: {
          throw new errors.QueryOptionsInvalid(error.message);
        }
        case errors.QueryHandlerTypeMismatch.code: {
          throw new errors.QueryHandlerTypeMismatch(error.message);
        }
        default: {
          logger.error(
            'An unknown error occured.',
            withLogMetadata('api-client', 'queryView', { err: error, status })
          );

          throw new errors.UnknownError();
        }
      }
    }

    const jsonParser = new ParseJsonTransform();

    return pipeline(
      data,
      jsonParser,
      (err): void => {
        if (err) {
          // Do not handle errors explicitly. The returned stream will just close.
          logger.error(
            'An error occured during stream piping.',
            withLogMetadata('api-client', 'queryView', { err })
          );
        }
      }
    );
  }

  public async queryValue ({ viewName, queryName, queryOptions = {}}: {
    viewName: string;
    queryName: string;
    queryOptions?: Record<string, unknown>;
  }): Promise<QueryResultItem> {
    const { data, status } = await this.axios({
      method: 'get',
      url: `${this.url}/${viewName}/value/${queryName}`,
      params: queryOptions,
      paramsSerializer (params): string {
        return Object.entries(params).
          map(([ key, value ]): string => `${key}=${JSON.stringify(value)}`).
          join('&');
      }
    });

    if (status !== 200) {
      switch (data.code) {
        case errors.ViewNotFound.code: {
          throw new errors.ViewNotFound(data.message);
        }
        case errors.QueryHandlerNotFound.code: {
          throw new errors.QueryHandlerNotFound(data.message);
        }
        case errors.QueryOptionsInvalid.code: {
          throw new errors.QueryOptionsInvalid(data.message);
        }
        case errors.QueryHandlerTypeMismatch.code: {
          throw new errors.QueryHandlerTypeMismatch(data.message);
        }
        case errors.NotFound.code: {
          throw new errors.NotFound(data.message);
        }
        default: {
          logger.error('An unknown error occured.', { err: data, status });

          throw new errors.UnknownError();
        }
      }
    }

    return data;
  }
}

export { Client };

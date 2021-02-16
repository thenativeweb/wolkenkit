import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { Readable } from 'stream';
import streamToString from 'stream-to-string';

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

  public async getFile ({ id }: {
    id: string;
  }): Promise<{ id: string; name: string; contentType: string; stream: Readable }> {
    const { status, headers, data } = await this.axios({
      method: 'get',
      url: `${this.url}/file/${id}`,
      responseType: 'stream'
    });

    if (status === 200) {
      return {
        id,
        name: headers['x-name'],
        contentType: headers['content-type'],
        stream: data
      };
    }

    const error = JSON.parse(await streamToString(data));

    switch (error.code) {
      case errors.NotAuthenticated.code: {
        throw new errors.NotAuthenticated(error.message);
      }
      case errors.FileNotFound.code: {
        throw new errors.FileNotFound(error.message);
      }
      default: {
        logger.error('An unknown error occured.', { ex: error, status });

        throw new errors.UnknownError();
      }
    }
  }

  public async addFile ({ id, name, contentType, stream }: {
    id: string;
    name: string;
    contentType: string;
    stream: Readable;
  }): Promise<void> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/add-file`,
      headers: {
        'x-id': id,
        'x-name': name,
        'content-type': contentType
      },
      data: stream
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case errors.NotAuthenticated.code: {
        throw new errors.NotAuthenticated(data.message);
      }
      case errors.FileAlreadyExists.code: {
        throw new errors.FileAlreadyExists(data.message);
      }
      default: {
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError();
      }
    }
  }

  public async removeFile ({ id }: {
    id: string;
  }): Promise<void> {
    const { status, data } = await this.axios({
      method: 'post',
      url: `${this.url}/remove-file`,
      data: { id }
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case errors.NotAuthenticated.code: {
        throw new errors.NotAuthenticated(data.message);
      }
      case errors.FileNotFound.code: {
        throw new errors.FileNotFound(data.message);
      }
      default: {
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError();
      }
    }
  }
}

export { Client };

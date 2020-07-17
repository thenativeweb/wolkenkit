import axios from 'axios';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { Readable } from 'stream';
import streamToString from 'stream-to-string';

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

  public async getFile ({ id }: {
    id: string;
  }): Promise<void> {
    const { status, data } = await axios({
      method: 'get',
      url: `${this.url}/file/${id}`,
      responseType: 'stream',
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return data;
    }

    const error = JSON.parse(await streamToString(data));

    switch (data.code) {
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

  public async postAddFile ({ id, name, contentType, stream }: {
    id: string;
    name: string;
    contentType: string;
    stream: Readable;
  }): Promise<void> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/add-file`,
      headers: {
        'x-id': id,
        'x-name': name,
        'content-type': contentType
      },
      data: stream,
      validateStatus (): boolean {
        return true;
      }
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

  public async postRemoveFile ({ id }: {
    id: string;
  }): Promise<void> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/remove-file`,
      data: { id },
      validateStatus (): boolean {
        return true;
      }
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

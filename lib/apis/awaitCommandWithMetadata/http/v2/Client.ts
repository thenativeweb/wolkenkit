import axios from 'axios';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsFromJsonStreamTransform } from '../../../../common/utils/http/FilterHeartbeatsFromJsonStreamTransform';
import { flaschenpost } from 'flaschenpost';
import { HttpClient } from '../../../shared/HttpClient';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
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

  public async awaitCommandWithMetadata (): Promise<{ item: CommandWithMetadata<CommandData>; token: string }> {
    const { data } = await axios({
      method: 'get',
      url: this.url,
      responseType: 'stream'
    });

    const passThrough = new PassThrough({ objectMode: true });
    const heartbeatFilter = new FilterHeartbeatsFromJsonStreamTransform();

    const { item, token } = await new Promise((resolve, reject): void => {
      let unsubscribe: () => void;

      const onData = (command: any): void => {
        unsubscribe();
        resolve(command);
      };
      const onError = (err: any): void => {
        unsubscribe();
        reject(err);
      };

      unsubscribe = (): void => {
        passThrough.off('data', onData);
        passThrough.off('error', onError);
      };

      passThrough.on('data', onData);
      passThrough.on('error', onError);

      pipeline(
        data,
        heartbeatFilter,
        passThrough,
        (err): void => {
          if (err) {
            reject(err);
          }
        }
      );
    });

    return {
      item: new CommandWithMetadata(item),
      token
    };
  }

  public async renewLock ({ itemIdentifier, token }: {
    itemIdentifier: ItemIdentifier;
    token: string;
  }): Promise<void> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/renew-lock`,
      data: { itemIdentifier, token },
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case 'ETOKENMISMATCH': {
        throw new errors.TokenMismatch(data.message);
      }
      case 'EITEMIDENTIFIERMALFORMED': {
        throw new errors.ItemIdentifierMalformed(data.message);
      }
      case 'EITEMNOTFOUND': {
        throw new errors.ItemNotFound(data.message);
      }
      case 'EITEMNOTLOCKED': {
        throw new errors.ItemNotLocked(data.message);
      }
      default: {
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError();
      }
    }
  }

  public async acknowledge ({ itemIdentifier, token }: {
    itemIdentifier: ItemIdentifier;
    token: string;
  }): Promise<void> {
    const { status, data } = await axios({
      method: 'post',
      url: `${this.url}/acknowledge`,
      data: { itemIdentifier, token },
      validateStatus (): boolean {
        return true;
      }
    });

    if (status === 200) {
      return;
    }

    switch (data.code) {
      case 'ETOKENMISMATCH': {
        throw new errors.TokenMismatch(data.message);
      }
      case 'EITEMIDENTIFIERMALFORMED': {
        throw new errors.ItemIdentifierMalformed(data.message);
      }
      case 'EITEMNOTFOUND': {
        throw new errors.ItemNotFound(data.message);
      }
      case 'EITEMNOTLOCKED': {
        throw new errors.ItemNotLocked(data.message);
      }
      default: {
        logger.error('An unknown error occured.', { ex: data, status });

        throw new errors.UnknownError();
      }
    }
  }
}

export {
  Client
};

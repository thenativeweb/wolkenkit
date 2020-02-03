import axios from 'axios';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { FilterHeartbeatsFromJsonStreamTransform } from '../../../../common/utils/http/FilterHeartbeatsFromJsonStreamTransform';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { PassThrough, pipeline } from 'stream';

class Client {
  protected url: string;

  public constructor ({ protocol = 'http', hostName, port, path = '/' }: {
    protocol?: string;
    hostName: string;
    port: number;
    path?: string;
  }) {
    const url = `${protocol}://${hostName}:${port}${path}`;

    this.url = url.endsWith('/') ? url.slice(0, -1) : url;
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
        throw new errors.InvalidOperation(data.message, { data });
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
        throw new errors.InvalidOperation(data.message, { data });
      }
    }
  }
}

export {
  Client
};

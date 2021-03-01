import { errors } from '../../../../common/errors';
import { EventEmitter2 } from 'eventemitter2';
import { flaschenpost } from 'flaschenpost';
import { isCustomError } from 'defekt';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { writeLine } from '../../../base/writeLine';
import { Request, Response } from 'express';

const logger = flaschenpost.getLogger();

const getMessages = {
  description: 'Subscribes to messages.',
  path: ':channel',

  request: {},
  response: {
    statusCodes: [ 200 ],

    stream: true,
    body: {}
  },

  getHandler ({ messageEmitter, heartbeatInterval }: {
    messageEmitter: EventEmitter2;
    heartbeatInterval: number;
  }): WolkenkitRequestHandler {
    return async function (req: Request, res: Response): Promise<void> {
      try {
        const { channel } = req.params;

        const handleMessage = (message: object): void => {
          writeLine({ res, data: message });
        };

        res.startStream({ heartbeatInterval });

        res.socket?.once('close', (): void => {
          messageEmitter.off(channel, handleMessage);
        });

        messageEmitter.on(channel, handleMessage);
      } catch (ex: unknown) {
        // It can happen that the connection gets closed in the background, and
        // hence the underlying socket does not have a remote address any more. We
        // can't detect this using an if statement, because connection handling is
        // done by Node.js in a background thread, and we may have a race
        // condition here. So, we decided to actively catch this exception, and
        // take it as an indicator that the connection has been closed meanwhile.
        if (ex instanceof Error && ex.message === 'Remote address is missing.') {
          return;
        }

        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        logger.error(
          'An unexpected error occured.',
          withLogMetadata('api', 'subscribeMessages', { error })
        );
      }
    };
  }
};

export { getMessages };

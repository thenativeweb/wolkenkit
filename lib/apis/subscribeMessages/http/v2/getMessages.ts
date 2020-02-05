import { flaschenpost } from 'flaschenpost';
import PQueue from 'p-queue';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { writeLine } from '../../../base/writeLine';
import { Request, RequestHandler, Response } from 'express';

const logger = flaschenpost.getLogger();

const getMessages = function ({ messageEmitter }: {
  messageEmitter: SpecializedEventEmitter<object>;
}): RequestHandler {
  return async function (_req: Request, res: Response): Promise<void> {
    try {
      const messageQueue = new PQueue({ concurrency: 1 });

      const handleMessage = (message: object): void => {
        /* eslint-disable @typescript-eslint/no-floating-promises */
        messageQueue.add(async (): Promise<void> => {
          writeLine({ res, data: message });
        });
        /* eslint-enable @typescript-eslint/no-floating-promises */
      };

      res.connection.once('close', (): void => {
        messageEmitter.off(handleMessage);
        messageQueue.clear();
      });

      messageEmitter.on(handleMessage);
    } catch (ex) {
      // It can happen that the connection gets closed in the background, and
      // hence the underlying socket does not have a remote address any more. We
      // can't detect this using an if statement, because connection handling is
      // done by Node.js in a background thread, and we may have a race
      // condition here. So, we decided to actively catch this exception, and
      // take it as an indicator that the connection has been closed meanwhile.
      if (ex.message === 'Remote address is missing.') {
        return;
      }

      logger.error('An unexpected error occured.', { ex });

      throw ex;
    }
  };
};

export { getMessages };

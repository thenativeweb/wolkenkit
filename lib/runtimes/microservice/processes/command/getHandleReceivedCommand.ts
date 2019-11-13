import axios from 'axios';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import flaschenpost from 'flaschenpost';
import retry from 'async-retry';

const logger = flaschenpost.getLogger();

type HandleReceivedCommand = ({ command }: {
  command: CommandWithMetadata<CommandData>;
}) => Promise<void>;

const getHandleReceivedCommand = function ({ dispatcherServer }: {
  dispatcherServer: {
    hostName: string;
    port: number;
    retries: number;
  };
}): HandleReceivedCommand {
  const { hostName, port, retries } = dispatcherServer;

  return async function ({ command }): Promise<void> {
    try {
      await retry(async (): Promise<void> => {
        await axios({
          method: 'POST',
          url: `http://${hostName}:${port}/command/v2`,
          data: command
        });
      }, { retries, maxTimeout: 1000 });

      logger.info('Command forwarded to dispatcher server.', { command });
    } catch (ex) {
      logger.error('Failed to forward command to dispatcher server.', { command, ex });

      throw new errors.ForwardFailed();
    }
  };
};

export { getHandleReceivedCommand };

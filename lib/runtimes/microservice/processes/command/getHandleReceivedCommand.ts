import CommandInternal from '../../../../common/elements/CommandInternal';
import errors from '../../../../common/errors';
import flaschenpost from 'flaschenpost';
import sendCommand from '../../../../communication/http/sendCommand';

const logger = flaschenpost.getLogger();

type HandleReceivedCommand = ({ command }: {
  command: CommandInternal;
}) => Promise<void>;

const getHandleReceivedCommand = function ({ dispatcherServer }: {
  dispatcherServer: {
    hostname: string;
    port: number;
    disableRetries: boolean;
  };
}): HandleReceivedCommand {
  const { hostname, port, disableRetries } = dispatcherServer;

  let retries = 4;

  if (disableRetries) {
    retries = 0;
  }

  return async function ({ command }): Promise<void> {
    try {
      await sendCommand({
        command,
        protocol: 'http',
        hostname,
        port,
        pathname: '/command/v2',
        retries
      });

      logger.info('Command forwarded to dispatcher server.', { command });
    } catch (ex) {
      logger.error('Failed to forward command to dispatcher server.', { command, ex });

      throw new errors.ForwardFailed();
    }
  };
};

export default getHandleReceivedCommand;

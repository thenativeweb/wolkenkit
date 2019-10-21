import axios from 'axios';
import CommandExternal from '../../common/elements/CommandExternal';
import errors from '../../common/errors';
import retry from 'async-retry';

const sendCommand = async function ({
  command,
  protocol,
  hostname,
  port,
  pathname,
  retries
}: {
  command: CommandExternal;
  protocol: string;
  hostname: string;
  port: number;
  pathname: string;
  retries: number;
}): Promise<void> {
  try {
    await retry(async (): Promise<void> => {
      await axios({
        method: 'post',
        url: `${protocol}://${hostname}:${port}${pathname}`,
        data: command
      });
    }, {
      retries,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: Number.POSITIVE_INFINITY,
      randomize: false
    });
  } catch (ex) {
    throw new errors.RequestFailed(ex.message);
  }
};

export default sendCommand;

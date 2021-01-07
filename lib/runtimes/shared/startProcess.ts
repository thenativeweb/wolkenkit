import axios from 'axios';
import { getApplicationRoot } from '../../common/application/getApplicationRoot';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import { runfork } from 'runfork';

const startProcess = async function ({ runtime, name, enableDebugMode, portOrSocket, env = {}, onExit }: {
  runtime: string;
  name: string;
  enableDebugMode: boolean;
  portOrSocket: number | string;
  env: NodeJS.ProcessEnv;
  onExit?: (exitCode: number, stdout: string, stderr: string) => void;
}): Promise<() => Promise<void>> {
  const applicationRoot = await getApplicationRoot({ directory: __dirname });

  const stopProcess = runfork({
    nodeArgs: enableDebugMode ? [ '--inspect' ] : [],
    path: path.join(applicationRoot, 'build', 'lib', 'runtimes', runtime, 'processes', name, 'app.js'),
    env,
    silent: false,
    onExit
  });

  await retry(async (): Promise<void> => {
    // eslint-disable-next-line unicorn/prefer-ternary
    if (typeof portOrSocket === 'number') {
      await axios({
        method: 'get',
        url: `http://localhost:${portOrSocket}/health/v2`
      });
    } else {
      await axios({
        method: 'get',
        url: `http://localhost/health/v2`,
        socketPath: portOrSocket
      });
    }
  });

  return stopProcess;
};

export { startProcess };

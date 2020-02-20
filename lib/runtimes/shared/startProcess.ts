import axios from 'axios';
import { getApplicationRoot } from '../../common/application/getApplicationRoot';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import { runfork } from 'runfork';

const startProcess = async function ({ runtime, name, enableDebugMode, port, env = {}, onExit }: {
  runtime: string;
  name: string;
  enableDebugMode: boolean;
  port: number;
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
    await axios({
      method: 'get',
      url: `http://localhost:${port}/health/v2`
    });
  });

  return stopProcess;
};

export { startProcess };

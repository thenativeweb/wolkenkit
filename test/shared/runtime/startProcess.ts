import axios from 'axios';
import path from 'path';
import { retry } from 'retry-ignore-abort';
import { runfork } from 'runfork';

const startProcess = async function ({ runtime, name, port, env = {}, onExit }: {
  runtime: string;
  name: string;
  port: number;
  env: NodeJS.ProcessEnv;
  onExit?: (exitCode: number, stdout: string, stderr: string) => void;
}): Promise<() => Promise<void>> {
  const stopProcess = runfork({
    path: path.join(__dirname, '..', '..', '..', 'build', 'lib', 'runtimes', runtime, 'processes', name, 'app.js'),
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

import { buntstift } from 'buntstift';
import { errors } from '../../common/errors';
import { exec, which } from 'shelljs';

const verifyDocker = async function (): Promise<void> {
  buntstift.verbose('Looking for the Docker CLI...');

  const dockerPath = which('docker');
  const isDockerInstalled = Boolean(dockerPath);

  if (!isDockerInstalled) {
    buntstift.info('The Docker CLI could not be found.');
    throw new errors.ExecutableNotFound(`'docker' not found.`);
  }

  buntstift.verbose(`Using the Docker CLI from '${dockerPath}'.`);
  buntstift.verbose('Trying to reach Docker...');

  const { code, stdout } = exec(`docker version --format "{{json .}}"`, { silent: true });

  if (code !== 0) {
    throw new errors.DockerFailed();
  }

  const versionResult = JSON.parse(stdout);

  if (!versionResult.Client || !versionResult.Server) {
    buntstift.info('Docker is not reachable.');
    throw new errors.DockerNotReachable();
  }

  buntstift.verbose(`Detected Docker CLI version '${versionResult.Client.Version}', and server version '${versionResult.Server.Version}'.`);
};

export { verifyDocker };

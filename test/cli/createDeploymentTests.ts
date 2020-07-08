import { assert } from 'assertthat';
import { exists } from '../../lib/common/utils/fs/exists';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';

const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('create-deployment', function (): void {
  this.timeout(30_000);

  test('fails if not run in a directory containing a wolkenkit application.', async (): Promise<void> => {
    const appDirectory = await isolated();

    const createDeploymentCommand = `node ${cliPath} create-deployment`;

    const { code, stderr } = shell.exec(createDeploymentCommand, { cwd: appDirectory });

    assert.that(code).is.equalTo(1);
    assert.that(stderr).is.containing('Failed to create deployment manifests.');
  });

  test('fails if the deployment directory already exists.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    shell.exec(initCommand);

    const createDeploymentCommand = `node ${cliPath} create-deployment`;

    const { code, stderr } = shell.exec(createDeploymentCommand, { cwd: appDirectory });

    assert.that(code).is.equalTo(1);
    assert.that(stderr).is.containing('Failed to create deployment manifests.');
  });

  test('creates deployment manifests in the deployment directory.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    shell.exec(initCommand);

    shell.rm('-rf', path.join(appDirectory, 'deployment'));

    const createDeploymentCommand = `node ${cliPath} create-deployment`;

    const { code } = shell.exec(createDeploymentCommand, { cwd: appDirectory });

    assert.that(code).is.equalTo(0);

    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'microservice.postgres.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'single-process.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'single-process.postgres.yml') })).is.true();
  });

  test('creates deployment manifests in the given directory.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);
    const deploymentDirectory = path.join(appDirectory, 'deployment-temp');

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    shell.exec(initCommand);

    const createDeploymentCommand = `node ${cliPath} create-deployment --deployment-directory ${deploymentDirectory}`;

    const { code } = shell.exec(createDeploymentCommand, { cwd: appDirectory });

    assert.that(code).is.equalTo(0);

    assert.that(await exists({ path: path.join(deploymentDirectory, 'docker-compose', 'microservice.postgres.yml') })).is.true();
    assert.that(await exists({ path: path.join(deploymentDirectory, 'docker-compose', 'single-process.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(deploymentDirectory, 'docker-compose', 'single-process.postgres.yml') })).is.true();
  });
});

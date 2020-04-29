import { assert } from 'assertthat';
import { exists } from '../../lib/common/utils/fs/exists';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';

const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('init', function (): void {
  this.timeout(30_000);

  test('fails if a deployment directory already exists.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    shell.exec(initCommand);

    const createDeploymentCommand = `node ${cliPath} create-deployment --directory ${appDirectory} ${appName}`;

    const { code, stdout } = shell.exec(createDeploymentCommand);

    assert.that(code).is.equalTo(1);
    assert.that(stdout).is.containing(`Could not create deployment manifests since the deployment directory ${path.join(appDirectory, 'deployment')} already exists.`);
    assert.that(stdout).is.containing('Use the --force flag to overwrite the directory.');
  });

  test('creates all deployment manifests in the deployment directory.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    shell.exec(initCommand);

    shell.rm('-rf', path.join(appDirectory, 'deployment'));

    const createDeploymentCommand = `node ${cliPath} create-deployment --directory ${appDirectory} ${appName}`;

    const { code } = shell.exec(createDeploymentCommand);

    assert.that(code).is.equalTo(0);

    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'docker-compose.microservice.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'docker-compose.microservice.postgres.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'docker-compose.single-process.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'docker-compose.single-process.postgres.yml') })).is.true();
  });

  test('creates deployment manifests in the given directory in the app directory.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);
    const deploymentDirectory = 'deployment-temp';

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    shell.exec(initCommand);

    const createDeploymentCommand = `node ${cliPath} create-deployment --directory ${appDirectory} --deployment-directory ${deploymentDirectory} ${appName}`;

    const { code } = shell.exec(createDeploymentCommand, { cwd: appDirectory });

    assert.that(code).is.equalTo(0);

    assert.that(await exists({ path: path.join(appDirectory, deploymentDirectory, 'docker-compose', 'docker-compose.microservice.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, deploymentDirectory, 'docker-compose', 'docker-compose.microservice.postgres.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, deploymentDirectory, 'docker-compose', 'docker-compose.single-process.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, deploymentDirectory, 'docker-compose', 'docker-compose.single-process.postgres.yml') })).is.true();
  });

  test('overwrites an existing deployment directory if the --force flag is given.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    shell.exec(initCommand);

    shell.rm('rf', path.join(appDirectory, 'deployment', 'docker-compose'));

    const createDeploymentCommand = `node ${cliPath} create-deployment --directory ${appDirectory} --force ${appName}`;

    const { code } = shell.exec(createDeploymentCommand, { cwd: appDirectory });

    assert.that(code).is.equalTo(0);

    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'docker-compose.microservice.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'docker-compose.microservice.postgres.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'docker-compose.single-process.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment', 'docker-compose', 'docker-compose.single-process.postgres.yml') })).is.true();
  });
});

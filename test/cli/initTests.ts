import { assert } from 'assertthat';
import { exists } from '../../lib/common/utils/fs/exists';
import fs from 'fs';
import { isolated } from 'isolated';
import { PackageManifest } from '../../lib/common/application/PackageManifest';
import path from 'path';
import shell from 'shelljs';

const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('init', function (): void {
  this.timeout(30_000);

  test('sets the application name in the package.json file.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    const { code } = shell.exec(initCommand);

    assert.that(code).is.equalTo(0);

    const packageJsonPath = path.join(appDirectory, 'package.json');
    const packageJson: PackageManifest = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));

    assert.that(packageJson.name).is.equalTo(appName);
  });

  test('sets the application name in the package.json file even when a scope is used.', async (): Promise<void> => {
    const appName = '@scope/test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    const { code } = shell.exec(initCommand);

    assert.that(code).is.equalTo(0);

    const packageJsonPath = path.join(appDirectory, 'package.json');
    const packageJson: PackageManifest = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));

    assert.that(packageJson.name).is.equalTo(appName);
  });

  test('supports numbers in application names.', async (): Promise<void> => {
    const appName = 'test-app-42';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    const { code } = shell.exec(initCommand);

    assert.that(code).is.equalTo(0);
  });

  test('is able to deal with special characters such as spaces in the path to the application.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), 'something with spaces', appName);

    const initCommand = `node ${cliPath} --verbose init --directory '${appDirectory}' --template blank --language javascript ${appName}`;

    const { code } = shell.exec(initCommand);

    assert.that(code).is.equalTo(0);
  });

  test('throws an error if the application directory already exists.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = await isolated();

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    const { code, stderr } = shell.exec(initCommand);

    assert.that(code).is.equalTo(1);
    assert.that(stderr.includes('Failed to initialize the application.')).is.true();
  });

  test('does not throw an error if the application scope directory already exists.', async (): Promise<void> => {
    const appName = '@scope/test-app';
    const rootDirectory = await isolated();
    const appDirectory = path.join(rootDirectory, appName);

    await fs.promises.mkdir(path.join(rootDirectory, '@scope'));

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    const { code } = shell.exec(initCommand);

    assert.that(code).is.equalTo(0);
  });

  test('initializes a JavaScript application with the desired template.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;

    const { code } = shell.exec(initCommand);

    assert.that(code).is.equalTo(0);

    assert.that(await exists({ path: path.join(appDirectory, 'deployment/docker-compose/docker-compose.microservice.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment/docker-compose/docker-compose.microservice.postgres.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment/docker-compose/docker-compose.single-process.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment/docker-compose/docker-compose.single-process.postgres.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, '.dockerignore') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'Dockerfile') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'package.json') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'domain', 'sampleContext', 'sampleAggregate', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'domain', 'sampleContext', 'sampleAggregate', 'SampleState.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'domain', 'sampleContext', 'sampleAggregate', 'domainEvents', 'sampleDomainEvent.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'domain', 'sampleContext', 'sampleAggregate', 'commands', 'sampleCommand.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'views', 'sampleView', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'views', 'sampleView', 'initializer.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'views', 'sampleView', 'projections', 'sampleProjection.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'views', 'sampleView', 'queries', 'all.js') })).is.true();
  });

  test('initializes a TypeScript application with the desired template.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language typescript ${appName}`;

    const { code } = shell.exec(initCommand);

    assert.that(code).is.equalTo(0);

    assert.that(await exists({ path: path.join(appDirectory, 'deployment/docker-compose/docker-compose.microservice.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment/docker-compose/docker-compose.microservice.postgres.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment/docker-compose/docker-compose.single-process.in-memory.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'deployment/docker-compose/docker-compose.single-process.postgres.yml') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, '.dockerignore') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'Dockerfile') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'package.json') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'tsconfig.json') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'domain', 'sampleContext', 'sampleAggregate', 'index.ts') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'domain', 'sampleContext', 'sampleAggregate', 'SampleState.ts') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'domain', 'sampleContext', 'sampleAggregate', 'domainEvents', 'sampleDomainEvent.ts') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'domain', 'sampleContext', 'sampleAggregate', 'commands', 'sampleCommand.ts') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'views', 'sampleView', 'index.ts') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'views', 'sampleView', 'initializer.ts') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'views', 'sampleView', 'SampleViewItem.ts') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'views', 'sampleView', 'projections', 'sampleProjection.ts') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'server', 'views', 'sampleView', 'queries', 'all.ts') })).is.true();
  });
});

import { assert } from 'assertthat';
import { exists } from '../../lib/common/utils/fs/exists';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';

const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('build', function (): void {
  this.timeout(60_000);

  test('compiles a TypeScript application to JavaScript.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language typescript ${appName}`;
    const buildCommand = `node ${cliPath} --verbose build`;

    shell.exec(initCommand);
    shell.exec('npm install', { cwd: appDirectory });
    shell.exec(buildCommand, { cwd: appDirectory });

    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'SampleState.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'domainEvents', 'sampleDomainEvent.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'commands', 'sampleCommand.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'initializer.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'SampleViewItem.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'projections', 'sampleProjection.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'queries', 'all.js') })).is.true();
  });

  test('copies a JavaScript application to the build directory.', async (): Promise<void> => {
    const appName = 'test-app';
    const appDirectory = path.join(await isolated(), appName);

    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;
    const buildCommand = `node ${cliPath} --verbose build`;

    shell.exec(initCommand);
    shell.exec('npm install', { cwd: appDirectory });
    shell.exec(buildCommand, { cwd: appDirectory });

    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'SampleState.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'domainEvents', 'sampleDomainEvent.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'commands', 'sampleCommand.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'initializer.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'projections', 'sampleProjection.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'queries', 'all.js') })).is.true();
  });
});

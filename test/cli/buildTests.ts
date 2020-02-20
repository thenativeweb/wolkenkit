import { assert } from 'assertthat';
import { exists } from '../../lib/common/utils/fs/exists';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';

const appName = 'test-app';
const cliPath = path.join(__dirname, '..', '..', 'build', 'lib', 'bin', 'wolkenkit.js');

suite('build', function (): void {
  this.timeout(30_000);

  test('compiles a TypeScript application to JavaScript.', async (): Promise<void> => {
    const appDirectory = await isolated();

    const initCommand = `node ${cliPath} init --directory ${appDirectory} --template blank --language typescript ${appName}`;
    const buildCommand = `node ${cliPath} build`;

    shell.exec(initCommand);
    shell.exec('npm install', {
      cwd: appDirectory
    });
    shell.exec(buildCommand, {
      cwd: appDirectory
    });

    assert.that(await exists({ path: path.join(appDirectory, 'build', 'domain', 'sampleContext', 'sampleAggregate', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'domain', 'sampleContext', 'sampleAggregate', 'SampleState.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'domain', 'sampleContext', 'sampleAggregate', 'domainEvents', 'sampleDomainEvent.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'domain', 'sampleContext', 'sampleAggregate', 'commands', 'sampleCommand.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'views', 'sampleView', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'views', 'sampleView', 'initializer.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'views', 'sampleView', 'SampleViewItem.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'views', 'sampleView', 'projections', 'sampleProjection.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'views', 'sampleView', 'queries', 'all.js') })).is.true();
  });

  test('copies a JavaScript application to the build directory.', async (): Promise<void> => {
    const appDirectory = await isolated();

    const initCommand = `node ${cliPath} init --directory ${appDirectory} --template blank --language javascript ${appName}`;
    const buildCommand = `node ${cliPath} build`;

    shell.exec(initCommand);
    shell.exec('npm install', {
      cwd: appDirectory
    });
    shell.exec(buildCommand, {
      cwd: appDirectory
    });

    assert.that(await exists({ path: path.join(appDirectory, 'build', 'domain', 'sampleContext', 'sampleAggregate', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'domain', 'sampleContext', 'sampleAggregate', 'SampleState.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'domain', 'sampleContext', 'sampleAggregate', 'domainEvents', 'sampleDomainEvent.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'domain', 'sampleContext', 'sampleAggregate', 'commands', 'sampleCommand.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'views', 'sampleView', 'index.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'views', 'sampleView', 'initializer.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'views', 'sampleView', 'projections', 'sampleProjection.js') })).is.true();
    assert.that(await exists({ path: path.join(appDirectory, 'build', 'views', 'sampleView', 'queries', 'all.js') })).is.true();
  });
});

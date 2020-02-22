import { assert } from 'assertthat';
import { exists } from '../../lib/common/utils/fs/exists';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';

const appName = 'test-app';
const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('init', function (): void {
  this.timeout(30_000);

  suite('template: blank', (): void => {
    suite('language: JavaScript', (): void => {
      test('creates all expected files.', async (): Promise<void> => {
        const appDirectory = path.join(await isolated(), appName);
        const initCommand = `node ${cliPath} init --directory ${appDirectory} --template blank --language javascript ${appName}`;

        shell.exec(initCommand);

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
    });

    suite('language: TypeScript', (): void => {
      test('creates all expected files.', async (): Promise<void> => {
        const appDirectory = path.join(await isolated(), appName);
        const initCommand = `node ${cliPath} init --directory ${appDirectory} --template blank --language typescript ${appName}`;

        shell.exec(initCommand);

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
  });
});

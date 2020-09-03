import { assert } from 'assertthat';
import fs from 'fs';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';
import { stripIndents } from 'common-tags';
import { v4 } from 'uuid';

const appName = 'test-app';
const rootPath = path.join(__dirname, '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup infrastructure', function (): void {
  this.timeout(300_000);

  test(`sets up an application's infrastructure.`, async (): Promise<void> => {
    const appDirectory = path.join(await isolated(), appName);
    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template chat --language javascript ${appName}`;

    shell.exec(initCommand);
    shell.exec(`npm install --production`, {
      cwd: appDirectory
    });
    shell.exec(`node ${cliPath} build`, {
      cwd: appDirectory
    });

    const randomString = v4();

    await fs.promises.writeFile(
      path.join(appDirectory, 'build', 'server', 'infrastructure', 'setupInfrastructure.js'),
      stripIndents`
        'use strict';
        const setupInfrastructure = async function () {
          console.log('${randomString}');
        };
        module.exports = { setupInfrastructure };
      `
    );

    const setupInfrastructureCommand = `node ${cliPath} --verbose setup infrastructure`;

    const { stdout } = shell.exec(setupInfrastructureCommand, {
      cwd: appDirectory
    });

    assert.that(stdout).is.containing(`Setting up the infrastructure for the '${appName}' application...`);
    assert.that(stdout).is.containing(randomString);
    assert.that(stdout).is.containing(`Successfully set up the infrastructure for the '${appName}' application...`);
  });
});

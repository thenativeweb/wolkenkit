'use strict';

const path = require('path');

const assert = require('assertthat');

const changePackageJson = require('../helpers/changePackageJson'),
      copyCertificate = require('../helpers/copyCertificate'),
      getDirectoryList = require('../helpers/getDirectoryList'),
      suite = require('../helpers/suite');

const applicationLifecycleTests = async function (runtime) {
  await suite(`application lifecycle on ${runtime}`, async ({ test, wolkenkit, ipAddress }) => {
    let applicationDirectory;

    await test('[wolkenkit init --template] initializes a new application using the specified template.', async ({ directory }) => {
      applicationDirectory = directory;

      const template = `https://github.com/thenativeweb/wolkenkit-template-chat.git#wolkenkit-${runtime}`;

      const { code, stderr, stdout } = await wolkenkit('init', { template }, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.equalTo(`  Initializing a new application...\n  Cloning ${template}...\n✓ Initialized a new application.\n`);
      assert.that(stderr).is.equalTo('');

      const directoryList = await getDirectoryList(applicationDirectory);

      assert.that(directoryList).is.containingAllOf([ 'client', 'server', 'package.json' ]);
      assert.that(directoryList).is.not.containingAllOf([ '.git' ]);

      await changePackageJson({
        directory: applicationDirectory,
        data: {
          wolkenkit: {
            environments: {
              default: {
                api: {
                  address: { host: ipAddress },
                  certificate: '/server/keys'
                }
              }
            }
          }
        }
      });
      await copyCertificate({ ipAddress, to: path.join(applicationDirectory, 'server', 'keys') });
    });

    await test('[wolkenkit status] reports that the application is stopped.', async () => {
      const { code, stderr, stdout } = await wolkenkit('status', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/The application is stopped/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit start] starts the application.', async () => {
      const { code, stderr, stdout } = await wolkenkit('start', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(new RegExp(`Installing wolkenkit ${runtime} on environment default...`));
      assert.that(stdout).is.matching(/Started the application/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit status] reports that the application is running.', async () => {
      const { code, stderr, stdout } = await wolkenkit('status', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/The application is running/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit logs] shows the application log output.', async () => {
      const { code, stderr, stdout } = await wolkenkit('logs', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/wolkenkit-broker/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit restart] restarts the application.', async () => {
      const { code, stderr, stdout } = await wolkenkit('restart', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/Removing Docker containers.../);
      assert.that(stdout).is.matching(/Starting Docker containers.../);
      assert.that(stdout).is.matching(/Restarted the application/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit status] reports that the application is running after having been restarted.', async () => {
      const { code, stderr, stdout } = await wolkenkit('status', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/The application is running/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit reload] reloads the application.', async () => {
      const { code, stderr, stdout } = await wolkenkit('reload', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/Removing Docker containers.../);
      assert.that(stdout).is.matching(/Starting Docker containers.../);
      assert.that(stdout).is.matching(/Reloaded the application/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit status] reports that the application is running after having been reloaded.', async () => {
      const { code, stderr, stdout } = await wolkenkit('status', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/The application is running/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit stop] stops the application.', async () => {
      const { code, stderr, stdout } = await wolkenkit('stop', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/Stopped the application/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit status] reports that the application is finally stopped.', async () => {
      const { code, stderr, stdout } = await wolkenkit('status', {}, { cwd: applicationDirectory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/The application is stopped/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
    });

    await test('[wolkenkit logs] reports that the application is not running.', async () => {
      const { code, stderr, stdout } = await wolkenkit('logs', {}, { cwd: applicationDirectory });

      assert.that(code).is.not.equalTo(0);
      assert.that(stdout).is.matching(/The application is not running/);
      assert.that(stderr).is.matching(/Application certificate is self-signed/);
      assert.that(stderr).is.matching(/Failed to fetch application logs./);
    });
  });
};

module.exports = applicationLifecycleTests;

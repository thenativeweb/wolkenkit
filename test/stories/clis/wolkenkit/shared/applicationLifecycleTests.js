'use strict';

const path = require('path');

const assert = require('assertthat'),
      directoryCompare = require('dir-compare'),
      isolated = require('isolated');

const changePackageJson = require('../helpers/changePackageJson'),
      copyCertificate = require('../helpers/copyCertificate'),
      getDirectoryList = require('../helpers/getDirectoryList'),
      suiteAws = require('../helpers/suiteAws');

const applicationLifecycleTests = async function (runtime) {
  await suiteAws(`[clis/wolkenkit] application lifecycle on ${runtime}`, async ({ test, wolkenkit, ipAddress }) => {
    const importDirectory = {
      chatWith200000Events: path.join(__dirname, '..', '..', 'shared', 'exports', 'chat-with-200000-events'),
      chatWith200Events: path.join(__dirname, '..', '..', 'shared', 'exports', 'chat-with-200-events')
    };

    let applicationDirectory;

    await test('[wolkenkit init --template] initializes a new application using the specified template.', async ({ directory }) => {
      applicationDirectory = directory;

      const tagOrBranch = runtime === 'latest' ? 'latest' : `wolkenkit-${runtime}`;
      const template = `https://github.com/thenativeweb/wolkenkit-template-chat.git#${tagOrBranch}`;

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
                  host: { name: ipAddress, certificate: '/server/keys' }
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

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/The application is stopped/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit start] starts the application.', async () => {
      const { code, stderr, stdout } = await wolkenkit('start', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(new RegExp(`Installing wolkenkit ${runtime} on environment default...`, 'u'));
      assert.that(stdout).is.matching(/Using [0-9a-f]{40} as shared key/u);
      assert.that(stdout).is.matching(/Waiting for https:\/\/\d+\.\d+\.\d+\.\d+:3000/u);
      assert.that(stdout).is.matching(/Started the application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit status] reports that the application is running.', async () => {
      const { code, stderr, stdout } = await wolkenkit('status', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/The application is running/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit logs] shows the application log output.', async () => {
      const { code, stderr, stdout } = await wolkenkit('logs', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/wolkenkit-broker/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit restart] restarts the application.', async () => {
      const { code, stderr, stdout } = await wolkenkit('restart', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/Removing Docker containers.../u);
      assert.that(stdout).is.matching(/Starting Docker containers.../u);
      assert.that(stdout).is.matching(/Restarted the application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit status] reports that the application is running after having been restarted.', async () => {
      const { code, stderr, stdout } = await wolkenkit('status', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/The application is running/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit reload] reloads the application.', async () => {
      const { code, stderr, stdout } = await wolkenkit('reload', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/Removing Docker containers.../u);
      assert.that(stdout).is.matching(/Starting Docker containers.../u);
      assert.that(stdout).is.matching(/Reloaded the application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit status] reports that the application is running after having been reloaded.', async () => {
      const { code, stderr, stdout } = await wolkenkit('status', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/The application is running/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit stop] stops the application.', async () => {
      const { code, stderr, stdout } = await wolkenkit('stop', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/Stopped the application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit status] reports that the application is finally stopped.', async () => {
      const { code, stderr, stdout } = await wolkenkit('status', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/The application is stopped/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit logs] reports that the application is not running.', async () => {
      const { code, stderr, stdout } = await wolkenkit('logs', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stderr).is.matching(/Failed to fetch application logs./u);
      assert.that(stdout).is.matching(/The application is not running/u);
      assert.that(code).is.not.equalTo(0);
    });

    await test('[wolkenkit start --port --shared-key] starts the application with a custom port and shared key.', async () => {
      const { code, stderr, stdout } = await wolkenkit('start', {
        port: 4000,
        'shared-key': 'wolkenkit'
      }, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/Using wolkenkit as shared key/u);
      assert.that(stdout).is.matching(/Waiting for https:\/\/\d+\.\d+\.\d+\.\d+:4000/u);
      assert.that(stdout).is.matching(/Started the application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit stop] stops the application with a custom port.', async () => {
      const { code, stderr, stdout } = await wolkenkit('stop', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/Stopped the application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit import --from] imports application data.', async () => {
      const startCommand = await wolkenkit('start', {}, { cwd: applicationDirectory });

      assert.that(startCommand.stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(startCommand.stdout).is.matching(/Started the application/u);
      assert.that(startCommand.code).is.equalTo(0);

      const { code, stderr, stdout } = await wolkenkit('import', {
        from: importDirectory.chatWith200000Events
      }, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/Processed 200000 events/u);
      assert.that(stdout).is.matching(/Imported application data/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit export --to] exports application data.', async () => {
      const exportDirectory = await isolated();

      const { code, stderr, stdout } = await wolkenkit('export', {
        to: exportDirectory
      }, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/Processed 200000 events/u);
      assert.that(stdout).is.matching(/Exported application data/u);
      assert.that(code).is.equalTo(0);

      const { same } = await directoryCompare.compare(
        exportDirectory,
        importDirectory.chatWith200000Events,
        {
          compareSize: true,
          compareDate: false,
          compareContent: false,
          skipSubdirs: false,
          skipSymlinks: true,
          ignoreCase: false,
          noDiffSet: true
        }
      );

      assert.that(same).is.true();

      const stopCommand = await wolkenkit('stop', {}, { cwd: applicationDirectory });

      assert.that(stopCommand.stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stopCommand.stdout).is.matching(/Stopped the application/u);
      assert.that(stopCommand.code).is.equalTo(0);
    });

    await test('[wolkenkit start --persist] fails if shared key is missing.', async () => {
      const { code, stdout, stderr } = await wolkenkit('start', {
        persist: true
      }, { cwd: applicationDirectory });

      assert.that(stderr).is.equalTo('✗ Failed to start the application.\n');
      assert.that(stdout).is.matching(/Shared key must be set when enabling persistence/u);
      assert.that(code).is.not.equalTo(0);
    });

    await test('[wolkenkit start --persist] persists application data.', async () => {
      const exportDirectory = await isolated();

      const startCommand = await wolkenkit('start', {
        persist: true,
        'shared-key': 'wolkenkit'
      }, { cwd: applicationDirectory });

      assert.that(startCommand.stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(startCommand.stdout).is.matching(/Started the application/u);
      assert.that(startCommand.code).is.equalTo(0);

      const importCommand = await wolkenkit('import', {
        from: importDirectory.chatWith200Events
      }, { cwd: applicationDirectory });

      assert.that(importCommand.stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(importCommand.stdout).is.matching(/Processed 200 events/u);
      assert.that(importCommand.stdout).is.matching(/Imported application data/u);
      assert.that(importCommand.code).is.equalTo(0);

      const restartCommand = await wolkenkit('restart', {}, { cwd: applicationDirectory });

      assert.that(restartCommand.stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(restartCommand.stdout).is.matching(/Restarted the application/u);
      assert.that(restartCommand.code).is.equalTo(0);

      const stopCommand = await wolkenkit('stop', {}, { cwd: applicationDirectory });

      assert.that(stopCommand.stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stopCommand.stdout).is.matching(/Stopped the application/u);
      assert.that(stopCommand.code).is.equalTo(0);

      const startWithPreviousDataCommand = await wolkenkit('start', {
        persist: true,
        'shared-key': 'wolkenkit'
      }, { cwd: applicationDirectory });

      assert.that(startWithPreviousDataCommand.stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(startWithPreviousDataCommand.stdout).is.matching(/Started the application/u);
      assert.that(startWithPreviousDataCommand.code).is.equalTo(0);

      const exportCommand = await wolkenkit('export', {
        to: exportDirectory
      }, { cwd: applicationDirectory });

      assert.that(exportCommand.stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(exportCommand.stdout).is.matching(/Processed 200 events/u);
      assert.that(exportCommand.stdout).is.matching(/Exported application data/u);
      assert.that(exportCommand.code).is.equalTo(0);

      const { same } = await directoryCompare.compare(
        exportDirectory,
        importDirectory.chatWith200Events,
        {
          compareSize: true,
          compareDate: false,
          compareContent: false,
          skipSubdirs: false,
          skipSymlinks: true,
          ignoreCase: false,
          noDiffSet: true
        }
      );

      assert.that(same).is.true();

      const stopAndDestroyDataCommand = await wolkenkit('stop', {
        'dangerously-destroy-data': true
      }, { cwd: applicationDirectory });

      assert.that(stopAndDestroyDataCommand.stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stopAndDestroyDataCommand.stdout).is.matching(/Destroying previous data/u);
      assert.that(stopAndDestroyDataCommand.stdout).is.matching(/Stopped the application/u);
      assert.that(stopAndDestroyDataCommand.code).is.equalTo(0);
    });

    await test('[wolkenkit start --dangerously-expose-http-ports] starts the application with exposed http ports.', async () => {
      const { code, stderr, stdout } = await wolkenkit('start', {
        'dangerously-expose-http-ports': true
      }, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stderr).is.matching(/Exposed HTTP ports 3010 and 3011/u);
      assert.that(stdout).is.matching(/Started the application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit restart] restarts the application with exposed http ports.', async () => {
      const { code, stderr, stdout } = await wolkenkit('restart', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stderr).is.matching(/Exposed HTTP ports 3010 and 3011/u);
      assert.that(stdout).is.matching(/Restarted the application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit reload] reloads the application with exposed http ports.', async () => {
      const { code, stderr, stdout } = await wolkenkit('reload', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stderr).is.matching(/Exposed HTTP ports 3010 and 3011/u);
      assert.that(stdout).is.matching(/Reloaded the application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit stop] stops the application with exposed http ports.', async () => {
      const { code, stderr, stdout } = await wolkenkit('stop', {}, { cwd: applicationDirectory });

      assert.that(stderr).is.matching(/Application certificate is self-signed/u);
      assert.that(stdout).is.matching(/Stopped the application/u);
      assert.that(code).is.equalTo(0);
    });
  });
};

module.exports = applicationLifecycleTests;

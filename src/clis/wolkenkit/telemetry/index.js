'use strict';

const fs = require('fs'),
      os = require('os'),
      path = require('path'),
      { promisify } = require('util');

const axios = require('axios'),
      buntstift = require('buntstift'),
      deepHash = require('deep-hash'),
      dotFile = require('dotfile-json'),
      retry = require('async-retry'),
      semver = require('semver'),
      stringifyObject = require('stringify-object'),
      uuid = require('uuidv4');

const { Command } = require('../../../common/elements'),
      getConfiguration = require('../commands/shared/getConfiguration'),
      packageJson = require('../../../package.json');

const stat = promisify(fs.stat);

const telemetry = {
  fileName: '.wolkenkit',

  allowedCommands: {
    reload: { event: 'reloaded' },
    restart: { event: 'restarted' },
    start: { event: 'started' },
    stop: { event: 'stopped' }
  },

  async init () {
    const { version } = packageJson;

    const homeDirectory = os.homedir();

    try {
      const stats = await stat(path.join(homeDirectory, this.fileName));

      if (stats.isDirectory()) {
        buntstift.error('Please delete the .wolkenkit directory in your home directory, as this is a relic of the wolkenkit beta.');

        return buntstift.exit(1);
      }
    } catch (ex) {
      if (ex.code !== 'ENOENT') {
        throw ex;
      }

      // Ignore that no .wolkenkit file was found. This means that no dotfile has been written
      // so far, and that there is also no relic of the beta. Hence, everything is fine.
    }

    let hasChanges = false;

    const data = await dotFile.read(this.fileName);

    if (!data.installationId) {
      data.installationId = uuid();

      hasChanges = true;
    }
    if (!data.versions) {
      data.versions = {};

      hasChanges = true;
    }

    if (!data.versions[version]) {
      const latestVersion = Object.keys(data.versions).sort((version1, version2) => !semver.gt(version1, version2))[0];

      if (!latestVersion || (latestVersion && !data.versions[latestVersion].sendTelemetry)) {
        buntstift.newLine();
        buntstift.success('Welcome to wolkenkit!');
        buntstift.newLine();
        buntstift.info('wolkenkit is a free open source project that is continuously being developed');
        buntstift.info('by the native web.');
        buntstift.newLine();
        buntstift.info('We would be very thankful if you could share a few data about your use of the');
        buntstift.info('wolkenkit CLI with us, as it helps us to improve wolkenkit. Since we respect');
        buntstift.info('your privacy, this data is strictly anonymous and does not contain any data');
        buntstift.info('on your application or your users.');
        buntstift.newLine();
        buntstift.info('You can view and revise your decision at any time using the CLI\'s telemetry');
        buntstift.info('command. Not sharing your data will not result in any disadvantages for you.');
        buntstift.info('For details, see https://www.thenativeweb.io/telemetry');
        buntstift.newLine();

        const no = 'No, thanks.';
        const yes = 'Yes, I agree to share anonymous usage data with the native web.';

        const answer = await buntstift.select('Do you agree to share anonymous usage data with the native web?', [
          no, yes
        ]);
        const confirmed = answer === yes;

        buntstift.newLine();

        data.versions[version] = { sendTelemetry: confirmed };

        hasChanges = true;
      }

      if (latestVersion && data.versions[latestVersion].sendTelemetry) {
        data.versions[version] = { sendTelemetry: true };

        hasChanges = true;
      }
    }

    if (hasChanges) {
      await dotFile.write(this.fileName, data);
    }
  },

  async isEnabled () {
    const { version } = packageJson;
    const data = await dotFile.read(this.fileName);

    return Boolean(data.versions[version].sendTelemetry);
  },

  async enable () {
    const { version } = packageJson;
    const data = await dotFile.read(this.fileName);

    data.versions[version].sendTelemetry = true;

    await dotFile.write(this.fileName, data);
  },

  async disable () {
    const { version } = packageJson;
    const data = await dotFile.read(this.fileName);

    data.versions[version].sendTelemetry = false;

    await dotFile.write(this.fileName, data);
  },

  async send (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.command) {
      throw new Error('Command name is missing.');
    }
    if (!options.args) {
      throw new Error('Arguments are missing.');
    }

    const { command, args } = options;
    const { version } = packageJson;
    const { help, env } = args;

    // If a command was called with the --help flag, abort.
    if (help) {
      return;
    }

    const data = await dotFile.read(this.fileName);

    if (!data.versions[version].sendTelemetry) {
      return;
    }

    if (!this.allowedCommands[command]) {
      return;
    }

    buntstift.verbose('Sending telemetry data...');

    try {
      const configuration = await getConfiguration({
        directory: process.cwd(),
        env,
        isPackageJsonRequired: true
      });

      const applicationName = configuration.application.name;
      const runtimeVersion = configuration.application.runtime.version;
      const { installationId } = data;
      const timestamp = Date.now();

      // Anonymize any data that are related to the user, the machine or the
      // application.
      const telemetryData = deepHash({
        installationId,
        application: {
          name: applicationName,
          env
        }
      }, installationId);

      // Add some non-anonymized data that do not refer to the user, the machine
      // or the application.
      telemetryData.timestamp = timestamp;
      telemetryData.cli = { version, command };
      telemetryData.runtime = runtimeVersion;

      const stringifiedTelemetryData = stringifyObject(telemetryData, {
        indent: '  ',
        singleQuotes: true
      }).split('\n');

      stringifiedTelemetryData.forEach(line => {
        buntstift.verbose(line);
      });

      await retry(async () => {
        await axios({
          method: 'post',
          url: `https://telemetry.wolkenkit.io/v1/command`,
          data: new Command({
            context: { name: 'collecting' },
            aggregate: { name: 'application', id: uuid.fromString(telemetryData.installationId) },
            name: 'recordEvent',
            data: {
              name: this.allowedCommands[command].event,
              data: telemetryData
            }
          })
        });
      }, {
        retries: 3,
        maxTimeout: 2 * 1000
      });
    } catch (ex) {
      buntstift.verbose('Failed to send telemetry data.');
      buntstift.verbose(ex.message);

      return;
    }

    buntstift.verbose('Telemetry data sent.');
  }
};

module.exports = telemetry;

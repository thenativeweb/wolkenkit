'use strict';

const fs = require('fs'),
      os = require('os'),
      path = require('path');

const buntstift = require('buntstift'),
      { Command } = require('commands-events'),
      deepHash = require('deep-hash'),
      dotFile = require('dotfile-json'),
      promisify = require('util.promisify'),
      request = require('requestretry'),
      semver = require('semver'),
      stringifyObject = require('stringify-object'),
      uuid = require('uuidv4');

const getConfiguration = require('../application/getConfiguration'),
      packageJson = require('../../package.json');

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

      // Ignore file not found error, because there is no relic of the wolkenkit beta.
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
        buntstift.info('As you know, wolkenkit is open source. This means that you can use it for');
        buntstift.info('free according to the license terms. We, the native web, are continuously');
        buntstift.info('improving wolkenkit.');
        buntstift.newLine();
        buntstift.info('If you want to help us to improve wolkenkit, we would be very thankful if');
        buntstift.info('you could share a few data about your use of the wolkenkit CLI with us. We');
        buntstift.info('don\'t collect any data on your running application or on the users of your');
        buntstift.info('application.');
        buntstift.newLine();
        buntstift.info('Since we respect your privacy, we collect the data in a strictly anonymous');
        buntstift.info('form, which makes it completely impossible for us to identify you, your');
        buntstift.info('computer, your application, or your users.');
        buntstift.newLine();
        buntstift.info('If you agree, we will collect the following data when you run a CLI command:');
        buntstift.newLine();
        buntstift.list('A random ID to distinguish your installation from others');
        buntstift.list('The version of wolkenkit you are using');
        buntstift.list('The version of the wolkenkit CLI you are using');
        buntstift.list('The name of the CLI command you are running');
        buntstift.list('The anonymized name of your wolkenkit application');
        buntstift.list('The anonymized environment of your wolkenkit application');
        buntstift.list('The current date and time in UTC');
        buntstift.newLine();
        buntstift.info('You can view and revise your decision at any time using the CLI\'s telemetry');
        buntstift.info('command. Not sharing your data will not result in any disadvantages for you.');
        buntstift.info('We have also made sure that you do not accidentally agree and have selected');
        buntstift.info('\'no\' as the default setting.');
        buntstift.newLine();

        const confirmed = await buntstift.confirm('Do you agree to share data about your use of wolkenkit with us?', false);

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
      const configuration = await getConfiguration({ directory: process.cwd() });

      const { application, runtime } = configuration;
      const { installationId } = data;
      const timestamp = Date.now();

      // Anonymize any data that are related to the user, the machine or the
      // application.
      const telemetryData = deepHash({
        installationId,
        application: {
          name: application,
          env
        }
      }, installationId);

      // Add some non-anonymized data that do not refer to the user, the machine
      // or the application.
      telemetryData.timestamp = timestamp;
      telemetryData.cli = { version, command };
      telemetryData.runtime = runtime;

      const stringifiedTelemetryData = stringifyObject(telemetryData, {
        indent: '  ',
        singleQuotes: true
      }).split('\n');

      stringifiedTelemetryData.forEach(line => {
        buntstift.verbose(line);
      });

      await request({
        method: 'POST',
        url: `https://telemetry.wolkenkit.io/v1/command`,
        json: true,
        body: new Command({
          context: { name: 'collecting' },
          aggregate: { name: 'application', id: uuid.fromString(installationId) },
          name: 'recordEvent',
          data: {
            name: this.allowedCommands[command].event,
            data: telemetryData
          }
        }),
        fullResponse: false,
        maxAttempts: 3,
        retryDelay: 2 * 1000,
        retryStrategy: request.RetryStrategies.HTTPOrNetworkError
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

'use strict';

const fs = require('fs'),
      os = require('os'),
      path = require('path');

const buntstift = require('buntstift'),
      deepHash = require('deep-hash'),
      dotFile = require('dotfile-json'),
      promisify = require('util.promisify'),
      request = require('superagent'),
      uuid = require('uuidv4');

const getConfiguration = require('../application/getConfiguration'),
      packageJson = require('../../package.json');

const stat = promisify(fs.stat);

const telemetry = {
  fileName: '.wolkenkit',

  allowForCommands: [
    'start',
    'restart',
    'reload',
    'stop'
  ],

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
      buntstift.info('We want to collect telemetry data...');
      buntstift.info('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam.');
      buntstift.info('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut.');

      const confirmed = await buntstift.confirm('Do you agree with collecting telemetry data?');

      buntstift.newLine();

      data.versions[version] = { sendTelemetry: confirmed };

      hasChanges = true;
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

    if (!this.allowForCommands.includes(command)) {
      return;
    }

    buntstift.verbose('Sending telemetry data...');

    try {
      const configuration = await getConfiguration({ directory: process.cwd() });

      const { application, runtime } = configuration;
      const { installationId } = data;
      const timestamp = Date.now();

      const telemetryData = deepHash({
        installationId,
        application,
        env
      }, installationId);

      telemetryData.timestamp = timestamp;
      telemetryData.cli = { version, command };
      telemetryData.runtime = runtime;

      await request.post('https://telemetry.wolkenkit.io/cli').send(telemetryData);
    } catch (ex) {
      buntstift.warn('Failed to send telemetry data.');
      buntstift.verbose(ex.message);

      return;
    }

    buntstift.verbose('Telemetry data sent.');
  }
};

module.exports = telemetry;

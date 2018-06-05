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
      const stats = await stat(path.join(homeDirectory, '.wolkenkit'));

      if (stats.isDirectory()) {
        // It is a leftover from beta phase.
        buntstift.error('Please delete the .wolkenkit directory in your home directory.');

        return buntstift.exit(1);
      }
    } catch (ex) {
      if (ex.code !== 'ENOENT') {
        throw ex;
      }
    }

    const data = await dotFile.read(this.fileName);

    if (!data.installationId) {
      data.installationId = uuid();
    }
    if (!data.versions) {
      data.versions = {};
    }

    if (!data.versions[version]) {
      buntstift.info('We want to collect telemetry data...');
      buntstift.info('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam.');
      buntstift.info('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut.');

      const confirmed = await buntstift.confirm('Do you agree with collecting telemetry data?');

      data.versions[version] = { sendTelemetry: confirmed };
    }

    await dotFile.write(this.fileName, data);
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

    // Since we don't want to collect command-calls with "--help" paramter,
    // we should stop here.
    if (help) {
      return;
    }

    const data = await dotFile.read(this.fileName);

    if (!data.versions[version].sendTelemetry) {
      buntstift.verbose(`Skip telemetry for version ${version}.`);

      return;
    }

    if (!this.allowForCommands.includes(command)) {
      buntstift.verbose(`Skip telemetry for command '${command}'.`);

      return;
    }

    buntstift.verbose('Sending telemetry data...');

    try {
      const configuration = await getConfiguration({ directory: process.cwd() });

      const { application, runtime } = configuration;
      const { installationId } = data;
      const dateTime = Date.now();

      const telemetryData = deepHash({
        installationId,
        application,
        env
      }, installationId);

      telemetryData.dateTime = dateTime;
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

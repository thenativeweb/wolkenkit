'use strict';

const defaults = require('./defaults.json'),
      runtimes = require('./runtimes');

class Configuration {
  constructor ({
    type,
    environment,
    applicationName,
    runtimeVersion,
    apiHostname,
    apiPort,
    packageJson,
    apiCertificate = undefined,
    dockerMachine = undefined
  }) {
    if (!type) {
      throw new Error('Type is missing.');
    }
    if (!environment) {
      throw new Error('Environment is missing.');
    }
    if (!applicationName) {
      throw new Error('Application name is missing.');
    }
    if (!runtimeVersion) {
      throw new Error('Runtime version is missing.');
    }
    if (!apiHostname) {
      throw new Error('Api hostname is missing.');
    }
    if (!apiPort) {
      throw new Error('Api port is missing.');
    }
    if (!packageJson) {
      throw new Error('Package json is missing.');
    }

    this.type = type;
    this.environment = environment;
    this.application = {
      name: applicationName,
      runtime: {
        version: runtimeVersion
      }
    };
    this.api = {
      host: {
        name: apiHostname,
        certificate: apiCertificate || defaults.commands.shared.certificate
      },
      port: apiPort
    };
    this.packageJson = packageJson;

    if (dockerMachine) {
      this.docker = {
        machine: dockerMachine
      };
    }
  }

  async containers ({
    dangerouslyExposeHttpPorts,
    debug,
    persistData,
    sharedKey
  }) {
    if (dangerouslyExposeHttpPorts === undefined) {
      throw new Error('Dangerously expose http ports is missing.');
    }
    if (debug === undefined) {
      throw new Error('Debug is missing.');
    }
    if (persistData === undefined) {
      throw new Error('Persist data is missing.');
    }
    if (!sharedKey) {
      throw new Error('Shared key is missing.');
    }

    const containers = await runtimes.getContainers({
      configuration: this,
      dangerouslyExposeHttpPorts,
      debug,
      forVersion: this.application.runtime.version,
      persistData,
      sharedKey
    });

    return containers;
  }
}

module.exports = Configuration;

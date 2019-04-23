'use strict';

const defaults = require('./defaults.json'),
      runtimes = require('../runtimes');

class Configuration {
  constructor ({
    type,
    environment,
    applicationName,
    runtimeVersion,
    packageJson,
    apiHostname = undefined,
    apiCertificate = undefined,
    apiPort = undefined,
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
        name: apiHostname || defaults.api.host.name,
        certificate: apiCertificate || defaults.api.host.certificate
      },
      port: apiPort || defaults.api.port
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
    secret
  }) {
    if (dangerouslyExposeHttpPorts === undefined) {
      throw new Error('Dangerously expose http ports is missing.');
    }
    if (debug === undefined) {
      throw new Error('Debug is missing.');
    }
    if (!secret) {
      throw new Error('Secret is missing.');
    }

    const containers = await runtimes.getContainers({
      configuration: this,
      dangerouslyExposeHttpPorts,
      debug,
      forVersion: this.application.runtime.version,
      secret
    });

    return containers;
  }

  async infrastructureContainers ({
    dangerouslyExposeHttpPorts,
    debug,
    secret
  }) {
    if (dangerouslyExposeHttpPorts === undefined) {
      throw new Error('Dangerously expose http ports is missing.');
    }
    if (debug === undefined) {
      throw new Error('Debug is missing.');
    }
    if (!secret) {
      throw new Error('Secret is missing.');
    }

    const containers = await this.containers({
      dangerouslyExposeHttpPorts,
      debug,
      secret
    });

    const infrastructureContainers = containers.filter(
      container => container.labels['wolkenkit-type'] === 'infrastructure'
    );

    return infrastructureContainers;
  }

  async applicationContainers ({
    dangerouslyExposeHttpPorts,
    debug,
    secret
  }) {
    if (dangerouslyExposeHttpPorts === undefined) {
      throw new Error('Dangerously expose http ports is missing.');
    }
    if (debug === undefined) {
      throw new Error('Debug is missing.');
    }
    if (!secret) {
      throw new Error('Secret is missing.');
    }

    const containers = await this.containers({
      dangerouslyExposeHttpPorts,
      debug,
      secret
    });

    const applicationContainers = containers.filter(
      container => container.labels['wolkenkit-type'] === 'application'
    );

    return applicationContainers;
  }
}

module.exports = Configuration;

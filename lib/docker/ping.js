'use strict';

const dockerCompare = require('docker-compare');

const errors = require('../errors'),
      getEnvironmentVariables = require('./getEnvironmentVariables'),
      shell = require('../shell');

const ping = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  const { configuration, env } = options;

  let runtimeVersion;

  try {
    runtimeVersion = configuration.runtime.version;
  } catch (ex) {
    throw new errors.ConfigurationMalformed();
  }

  let docker;

  try {
    /* eslint-disable global-require */
    docker = require(`../../configuration/${runtimeVersion}/docker`)();
    /* eslint-enable global-require */
  } catch (ex) {
    switch (ex.code) {
      case 'MODULE_NOT_FOUND':
        throw new errors.VersionNotFound();
      default:
        throw ex;
    }
  }

  const environmentVariables = await getEnvironmentVariables({ configuration, env });

  let output;

  try {
    output = await shell.exec(`docker version --format '{{json .}}'`, {
      env: environmentVariables
    });
  } catch (ex) {
    let result;

    try {
      result = JSON.parse(ex.stdout);
    } catch (exInner) {
      // Here, it is of interest why the command failed, not why the JSON
      // parsing failed. Hence, we ignore exInner and fall back to ex.
      throw ex;
    }

    if (result.Client && !result.Server) {
      throw new errors.DockerNotReachable();
    }

    throw ex;
  }

  let result;

  try {
    result = JSON.parse(output.stdout);
  } catch (ex) {
    throw new errors.JsonMalformed();
  }

  if (dockerCompare.lessThan(result.Server.Version, docker.minimumVersion)) {
    throw new errors.VersionMismatch(`Docker server version ${result.Server.Version} is too old, requires ${docker.minimumVersion} or higher.`);
  }
  if (dockerCompare.lessThan(result.Client.Version, docker.minimumVersion)) {
    throw new errors.VersionMismatch(`Docker client version ${result.Client.Version} is too old, requires ${docker.minimumVersion} or higher.`);
  }
};

module.exports = ping;

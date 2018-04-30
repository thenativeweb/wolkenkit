'use strict';

const map = require('lodash/map'),
      portscanner = require('portscanner'),
      promisify = require('util.promisify');

const errors = require('../../../../errors'),
      runtimes = require('../../../runtimes');

const findAPortInUse = promisify(portscanner.findAPortInUse);

const verifyThatPortsAreAvailable = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.forVersion) {
    throw new Error('For version is missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (options.persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (options.debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { forVersion, configuration, env, sharedKey, persistData, debug } = options;

  const containers = await runtimes.getContainers({
    forVersion,
    configuration,
    env,
    sharedKey,
    persistData,
    debug
  });

  const requestedPorts = map(containers, container => container.ports).
    filter(ports => ports).
    reduce((list, ports) => [ ...list, ...Object.values(ports) ], []);

  const host = configuration.environments[env].api.address.host;
  const portInUse = await findAPortInUse(requestedPorts, host);

  const arePortsAvailable = portInUse === false;

  if (arePortsAvailable) {
    return;
  }

  progress({ message: 'The requested ports are not available.', type: 'info' });
  throw new errors.PortsNotAvailable();
};

module.exports = verifyThatPortsAreAvailable;

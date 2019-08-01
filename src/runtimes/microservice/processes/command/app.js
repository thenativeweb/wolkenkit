#!/usr/bin/env node

'use strict';

const http = require('http'),
      path = require('path');

const express = require('express'),
      flaschenpost = require('flaschenpost'),
      getCorsOrigin = require('get-cors-origin'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      getEnvironmentVariables = require('../../../../common/utils/process/getEnvironmentVariables'),
      getHandleReceivedCommand = require('./getHandleReceivedCommand'),
      { Http: CommandHttp } = require('../../../../apis/command'),
      { Http: HealthHttp } = require('../../../../apis/health'),
      registerExceptionHandler = require('../../../../common/utils/process/registerExceptionHandler');

(async () => {
  registerExceptionHandler();

  const logger = flaschenpost.getLogger(),
        processId = uuid();

  const environmentVariables = getEnvironmentVariables({
    APPLICATION_DIRECTORY: path.join(__dirname, '..', '..', '..', '..', 'test', 'shared', 'applications', 'base'),
    COMMAND_CORS_ORIGIN: '*',
    DISPATCHER_SERVER_DISABLE_RETRIES: false,
    DISPATCHER_SERVER_HOSTNAME: 'dispatcher',
    DISPATCHER_SERVER_PORT: 3000,
    HEALTH_CORS_ORIGIN: '*',
    IDENTITY_PROVIDERS: [{
      issuer: 'https://token.invalid',
      certificate: path.join(__dirname, '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
    }],
    PORT: 3000
  });

  const dispatcherServer = {
    hostname: environmentVariables.DISPATCHER_SERVER_HOSTNAME,
    port: environmentVariables.DISPATCHER_SERVER_PORT,
    disableRetries: environmentVariables.DISPATCHER_SERVER_DISABLE_RETRIES
  };

  const identityProviders = environmentVariables.IDENTITY_PROVIDERS.
    map(identityProvider => ({
      issuer: identityProvider.issuer,
      certificate: path.join(identityProvider.certificate, 'certificate.pem')
    }));

  const application = await Application.load({
    directory: environmentVariables.APPLICATION_DIRECTORY
  });

  const handleReceivedCommand = getHandleReceivedCommand({ dispatcherServer });

  const commandHttp = new CommandHttp();
  const healthHttp = new HealthHttp();

  await commandHttp.initialize({
    corsOrigin: getCorsOrigin(environmentVariables.COMMAND_CORS_ORIGIN),
    purpose: 'external',
    onReceiveCommand: handleReceivedCommand,
    application,
    identityProviders
  });
  await healthHttp.initialize({
    corsOrigin: getCorsOrigin(environmentVariables.HEALTH_CORS_ORIGIN),
    processId
  });

  const api = express();

  api.use('/command', commandHttp.api);
  api.use('/health', healthHttp.api);

  const server = http.createServer(api);

  await new Promise(resolve => {
    server.listen(environmentVariables.PORT, resolve);
  });

  logger.info('Command server started.', { port: environmentVariables.PORT });
})();

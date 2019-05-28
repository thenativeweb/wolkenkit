#!/usr/bin/env node

'use strict';

const http = require('http'),
      path = require('path');

const express = require('express'),
      flaschenpost = require('flaschenpost'),
      getCorsOrigin = require('get-cors-origin');

const { Application } = require('../../common/application'),
      getEnvironmentVariables = require('../../common/utils/process/getEnvironmentVariables'),
      getHandleDispatchCommand = require('./getHandleDispatchCommand'),
      getHandleReceivedCommand = require('./getHandleReceivedCommand'),
      { Http: CommandHttp } = require('../../apis/command'),
      { Http: HealthHttp } = require('../../apis/health'),
      { InMemory: DispatcherCore } = require('../../cores/dispatcher'),
      registerExceptionHandler = require('../../common/utils/process/registerExceptionHandler');

(async () => {
  registerExceptionHandler();

  const logger = flaschenpost.getLogger();

  const environmentVariables = getEnvironmentVariables({
    APPLICATION_DIRECTORY: path.join(__dirname, '..', '..', 'test', 'shared', 'applications', 'base'),
    COMMAND_CORS_ORIGIN: '*',
    CONCURRENCY: 256,
    DOMAIN_SERVER_DISABLE_RETRIES: false,
    DOMAIN_SERVER_HOSTNAME: 'domain',
    DOMAIN_SERVER_PORT: 3000,
    HEALTH_CORS_ORIGIN: '*',
    IDENTITY_PROVIDERS: [{
      issuer: 'https://token.invalid',
      certificate: path.join(__dirname, '..', '..', 'keys', 'local.wolkenkit.io')
    }],
    PORT: 3000
  });

  const domainServer = {
    hostname: environmentVariables.DOMAIN_SERVER_HOSTNAME,
    port: environmentVariables.DOMAIN_SERVER_PORT,
    disableRetries: environmentVariables.DOMAIN_SERVER_DISABLE_RETRIES
  };

  const identityProviders = environmentVariables.IDENTITY_PROVIDERS.
    map(identityProvider => ({
      issuer: identityProvider.issuer,
      certificate: path.join(identityProvider.certificate, 'certificate.pem')
    }));

  const application = await Application.load({
    directory: environmentVariables.APPLICATION_DIRECTORY
  });

  const handleDispatchCommand = getHandleDispatchCommand({ domainServer });
  const dispatcher = new DispatcherCore();

  await dispatcher.initialize({
    concurrency: environmentVariables.CONCURRENCY,
    onDispatch: handleDispatchCommand
  });

  const handleReceivedCommand = getHandleReceivedCommand({ dispatcher });

  const commandHttp = new CommandHttp();
  const healthHttp = new HealthHttp();

  await commandHttp.initialize({
    corsOrigin: getCorsOrigin(environmentVariables.COMMAND_CORS_ORIGIN),
    purpose: 'internal',
    onReceiveCommand: handleReceivedCommand,
    application,
    identityProviders
  });
  await healthHttp.initialize({
    corsOrigin: getCorsOrigin(environmentVariables.HEALTH_CORS_ORIGIN)
  });

  const api = express();

  api.use('/command', commandHttp.api);
  api.use('/health', healthHttp.api);

  const server = http.createServer(api);

  server.listen(environmentVariables.PORT, () => {
    logger.info('Dispatcher server started.', { port: environmentVariables.PORT });
  });
})();

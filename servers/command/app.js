#!/usr/bin/env node

'use strict';

const http = require('http'),
      path = require('path');

const express = require('express'),
      flaschenpost = require('flaschenpost'),
      getCorsOrigin = require('get-cors-origin'),
      processenv = require('processenv');

const { Application } = require('../../common/application'),
      { CommandExternal } = require('../../common/elements'),
      getHandleReceivedCommand = require('./getHandleReceivedCommand'),
      { Http: CommandHttp } = require('../../apis/command'),
      { Http: HealthHttp } = require('../../apis/health'),
      registerExceptionHandler = require('../../common/utils/process/registerExceptionHandler');

(async () => {
  registerExceptionHandler();

  const logger = flaschenpost.getLogger();

  const port = processenv('PORT', 3000);

  const corsOriginCommand = getCorsOrigin(processenv('COMMAND_CORS_ORIGIN', '*')),
        corsOriginHealth = getCorsOrigin(processenv('HEALTH_CORS_ORIGIN', '*'));

  const dispatcher = {
    hostname: processenv('DISPATCHER_HOSTNAME', 'dispatcher'),
    port: processenv('DISPATCHER_PORT', 3000),
    disableRetries: processenv('DISPATCHER_DISABLE_RETRIES', false)
  };

  const identityProviders = processenv('IDENTITY_PROVIDERS', [
    {
      issuer: 'https://token.invalid',
      certificate: path.join(__dirname, '..', '..', 'keys', 'local.wolkenkit.io')
    }
  ]).
    map(identityProvider => ({
      issuer: identityProvider.issuer,
      certificate: path.join(identityProvider.certificate, 'certificate.pem')
    }));

  const applicationDirectory = processenv('APPLICATION_DIRECTORY',
    path.join(__dirname, '..', '..', 'test', 'shared', 'applications', 'base'));

  const application = await Application.load({
    directory: applicationDirectory
  });

  const handleReceivedCommand = getHandleReceivedCommand({ dispatcher });

  const commandHttp = new CommandHttp();
  const healthHttp = new HealthHttp();

  await commandHttp.initialize({
    corsOrigin: corsOriginCommand,
    Command: CommandExternal,
    onReceiveCommand: handleReceivedCommand,
    application,
    identityProviders
  });
  await healthHttp.initialize({
    corsOrigin: corsOriginHealth
  });

  const api = express();

  api.use('/command', commandHttp.api);
  api.use('/health', healthHttp.api);

  const server = http.createServer(api);

  server.listen(port, () => {
    logger.info('Command server started.', { port });
  });
})();

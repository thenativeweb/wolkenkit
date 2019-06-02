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
      getHandleReceivedEvent = require('./getHandleReceivedEvent'),
      { Http: EventHttp } = require('../../../../apis/event'),
      { Http: HealthHttp } = require('../../../../apis/health'),
      registerExceptionHandler = require('../../../../common/utils/process/registerExceptionHandler'),
      { Repository } = require('../../../../common/domain');

(async () => {
  registerExceptionHandler();

  const logger = flaschenpost.getLogger(),
        processId = uuid();

  const environmentVariables = getEnvironmentVariables({
    APPLICATION_DIRECTORY: path.join(__dirname, '..', '..', '..', '..', 'test', 'shared', 'applications', 'base'),
    EVENT_CORS_ORIGIN: '*',
    EVENTSTORE_OPTIONS: {},
    EVENTSTORE_TYPE: 'InMemory',
    HEALTH_CORS_ORIGIN: '*',
    IDENTITY_PROVIDERS: [{
      issuer: 'https://token.invalid',
      certificate: path.join(__dirname, '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
    }],
    PORT_EXTERNAL: 3000,
    PORT_INTERNAL: 4000
  });

  const identityProviders = environmentVariables.IDENTITY_PROVIDERS.
    map(identityProvider => ({
      issuer: identityProvider.issuer,
      certificate: path.join(identityProvider.certificate, 'certificate.pem')
    }));

  const application = await Application.load({
    directory: environmentVariables.APPLICATION_DIRECTORY
  });

  /* eslint-disable global-require */
  const Eventstore = require(`../../../../stores/eventstore/${environmentVariables.EVENTSTORE_TYPE}`);
  /* eslint-enable global-require */

  const eventstore = new Eventstore();

  await eventstore.initialize(environmentVariables.EVENTSTORE_OPTIONS);

  const repository = new Repository({ application, eventstore });

  const eventHttpInternal = new EventHttp();
  const eventHttpExternal = new EventHttp();
  const healthHttp = new HealthHttp();

  const handleReceivedEvent = getHandleReceivedEvent({ eventHttpExternal });

  await eventHttpInternal.initialize({
    corsOrigin: '*',
    purpose: 'internal',
    onReceiveEvent: handleReceivedEvent,
    application,
    repository,
    identityProviders
  });
  await eventHttpExternal.initialize({
    corsOrigin: getCorsOrigin(environmentVariables.EVENT_CORS_ORIGIN),
    purpose: 'external',
    application,
    repository,
    identityProviders
  });
  await healthHttp.initialize({
    corsOrigin: getCorsOrigin(environmentVariables.HEALTH_CORS_ORIGIN),
    processId
  });

  const apiInternal = express();
  const apiExternal = express();

  apiInternal.use('/event', eventHttpInternal.api);
  apiInternal.use('/health', healthHttp.api);

  apiExternal.use('/events', eventHttpExternal.api);
  apiExternal.use('/health', healthHttp.api);

  const serverInternal = http.createServer(apiInternal);
  const serverExternal = http.createServer(apiExternal);

  await new Promise(resolve => {
    serverInternal.listen(environmentVariables.PORT_INTERNAL, resolve);
  });

  logger.info('Event (internal) server started.', { port: environmentVariables.PORT_INTERNAL });

  await new Promise(resolve => {
    serverExternal.listen(environmentVariables.PORT_EXTERNAL, resolve);
  });

  logger.info('Event (external) server started.', { port: environmentVariables.PORT_EXTERNAL });
})();

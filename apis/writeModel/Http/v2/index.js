'use strict';

const express = require('express'),
      Limes = require('limes');

const getConfiguration = require('./getConfiguration'),
      getEvents = require('./getEvents'),
      postCommand = require('./postCommand');

const v2 = function ({
  commandStream,
  eventStream,
  application,
  repository,
  identityProviders,
  heartbeatInterval
}) {
  if (!commandStream) {
    throw new Error('Command stream is missing.');
  }
  if (!eventStream) {
    throw new Error('Event stream is missing.');
  }
  if (!application) {
    throw new Error('Application is missing.');
  }
  if (!repository) {
    throw new Error('Repository is missing.');
  }
  if (!identityProviders) {
    throw new Error('Identity providers are missing.');
  }
  if (!heartbeatInterval) {
    throw new Error('Heartbeat interval is missing.');
  }

  const api = express();

  const limes = new Limes({ identityProviders });
  const verifyTokenMiddleware = limes.verifyTokenMiddleware({
    // According to RFC 2606, .invalid is a reserved TLD you can use in cases
    // where you want to show that a domain is invalid. Since the tokens issued
    // for anonymous users are made-up, https://token.invalid makes up a valid
    // url, but we are sure that we do not run into any conflicts with the
    // domain.
    issuerForAnonymousTokens: 'https://token.invalid'
  });

  api.get('/configuration', getConfiguration({
    application
  }));

  api.post('/command', verifyTokenMiddleware, postCommand({
    commandStream,
    application,
    repository
  }));

  api.get('/events', verifyTokenMiddleware, getEvents({
    eventStream,
    application,
    heartbeatInterval
  }));

  return api;
};

module.exports = v2;

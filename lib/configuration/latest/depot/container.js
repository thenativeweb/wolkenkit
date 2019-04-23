'use strict';

const path = require('path');

const get = require('lodash/get');

const image = require('./image');

const container = function ({
  configuration,
  connections,
  dangerouslyExposeHttpPorts,
  debug,
  persistData,
  sharedKey
}) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!connections) {
    throw new Error('Connections are missing.');
  }
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

  const { environment, packageJson } = configuration;
  const { fileStorage } = connections;

  const selectedEnvironment = packageJson.environments[environment];

  const identityProviders = [];

  if (selectedEnvironment.identityProviders) {
    for (const identityProvider of selectedEnvironment.identityProviders) {
      identityProviders.push({
        issuer: identityProvider.issuer,
        certificate: path.posix.join('/', 'wolkenkit', 'app', identityProvider.certificate)
      });
    }
  } else {
    identityProviders.push({
      issuer: 'https://token.invalid',
      certificate: '/keys/wildcard.wolkenkit.io'
    });
  }

  const result = {
    image: `${configuration.application.name}-depot`,
    name: `${configuration.application.name}-depot`,
    env: {
      API_CORS_ORIGIN: selectedEnvironment.fileStorage.allowAccessFrom,
      HTTP_PORT: fileStorage.container.http.port,
      IDENTITYPROVIDERS: identityProviders,
      IS_AUTHORIZED_COMMANDS_ADD_FILE: get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') ?
        get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') :
        { forAuthenticated: true, forPublic: false },
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*'
    },
    labels: {
      'wolkenkit-api-port': configuration.api.port,
      'wolkenkit-application': configuration.application.name,
      'wolkenkit-dangerously-expose-http-ports': dangerouslyExposeHttpPorts,
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application.name}-network`
    ],
    networkAlias: 'depot',
    ports: {},
    restart: 'on-failure:3',
    volumes: [
      '/blobs'
    ]
  };

  switch (selectedEnvironment.fileStorage.provider.type) {
    case 'fileSystem': {
      result.env.PROVIDER_TYPE = 'fileSystem';
      result.env.PROVIDER_DIRECTORY = '/blobs';
      break;
    }
    case 's3': {
      result.env.PROVIDER_TYPE = 's3';
      result.env.PROVIDER_ENDPOINT = selectedEnvironment.fileStorage.provider.options.endpoint;
      result.env.PROVIDER_REGION = selectedEnvironment.fileStorage.provider.options.region;
      result.env.PROVIDER_BUCKET_NAME = selectedEnvironment.fileStorage.provider.options.bucketName;
      result.env.PROVIDER_ACCESS_KEY = selectedEnvironment.fileStorage.provider.options.accessKey;
      result.env.PROVIDER_SECRET_KEY = selectedEnvironment.fileStorage.provider.options.secret;
      break;
    }
    default: {
      throw new Error('Invalid operation.');
    }
  }

  if (dangerouslyExposeHttpPorts) {
    result.ports[fileStorage.container.http.port] = fileStorage.external.http.port;
  }

  if (persistData) {
    result.volumes = [
      `${configuration.application.name}-depot-volume:/blobs`
    ];
  }

  return result;
};

module.exports = container;

'use strict';

const processenv = require('processenv');

const getEnvironmentVariable = function (name) {
  const environmentVariable = processenv(name);

  if (!environmentVariable) {
    throw new Error(`Environment variable ${name} is missing.`);
  }

  return environmentVariable;
};

const getEnvironmentVariables = async function () {
  const environmentVariables = {
    browserstackCredentials: {
      username: getEnvironmentVariable('BROWSERSTACK_USERNAME'),
      accessKey: getEnvironmentVariable('BROWSERSTACK_ACCESS_KEY')
    },

    terraformCredentials: {
      awsAccessKey: getEnvironmentVariable('TF_VAR_aws_access_key'),
      awsSecretKey: getEnvironmentVariable('TF_VAR_aws_secret_key')
    },

    twitterCredentials: {
      consumerKey: getEnvironmentVariable('TWITTER_WOLKENKIT_RELEASE_CONSUMER_KEY'),
      consumerSecret: getEnvironmentVariable('TWITTER_WOLKENKIT_RELEASE_CONSUMER_SECRET'),
      accessTokenKey: getEnvironmentVariable('TWITTER_WOLKENKIT_RELEASE_ACCESS_TOKEN_KEY'),
      accessTokenSecret: getEnvironmentVariable('TWITTER_WOLKENKIT_RELEASE_ACCESS_TOKEN_SECRET')
    },

    virtualMachines: {
      vagrantCloud: getEnvironmentVariable('VAGRANT_CLOUD')
    }
  };

  return environmentVariables;
};

module.exports = getEnvironmentVariables;

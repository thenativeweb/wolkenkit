'use strict';

const { processenv } = require('processenv');
const { Collection, MongoClient } = require('mongodb');

const getInfrastructure = async function () {
  const url = processenv('MONGODB_URL');
  let messages = [];

  if (url) {
    const connection = await MongoClient.connect(url, {
      w: 1,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    messages = connection.db().collection('messages');
  }

  return {
    ask: {},
    tell: {
      viewStore: {
        messages
      }
    }
  };
};

const setupInfrastructure = async function () {
  // Intentionally left blank.
};

module.exports = { setupInfrastructure, getInfrastructure };

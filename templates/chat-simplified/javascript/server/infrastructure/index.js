'use strict';

const { processenv } = require('processenv');
const { MongoClient } = require('mongodb');

const getInfrastructure = async function () {
  const url = processenv('MONGODB_URL');
  let messages = [];

  if (url) {
    const connection = await MongoClient.connect(url, {
      // eslint-disable-next-line id-length
      w: 1,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    messages = connection.db().collection('messages');
  }

  return {
    ask: {
      viewStore: {
        messages
      }
    },
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

'use strict';

const { processenv } = require('processenv');
const { MongoClient } = require('mongodb');

const getInfrastructure = async function () {
  const url = processenv('MONGODB_URL');
  let aggregates = [];

  if (url) {
    const connection = await MongoClient.connect(url, {
      w: 1,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    aggregates = connection.db().collection('aggregates');
  }

  return {
    ask: {
      viewStore: {
        aggregates
      }
    },
    tell: {
      viewStore: {
        aggregates
      }
    }
  };
}

module.exports = { getInfrastructure };

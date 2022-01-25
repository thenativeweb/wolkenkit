'use strict';

const { MongoClient } = require('mongodb'),
      { processenv } = require('processenv');

const getInfrastructure = async function () {
  const url = processenv('MONGODB_URL');
  let messages = [];

  if (url) {
    const connection = await MongoClient.connect(url, {
      // eslint-disable-next-line id-length
      w: 1
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

module.exports = { getInfrastructure };

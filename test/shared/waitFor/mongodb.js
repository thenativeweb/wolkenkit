'use strict';

const { MongoClient } = require('mongodb'),
      retry = require('async-retry');

const waitForMongodb = async function ({ url }) {
  if (!url) {
    throw new Error('Url is missing.');
  }

  await retry(async () => {
    /* eslint-disable id-length */
    const client = await MongoClient.connect(url, { w: 1, useNewUrlParser: true });
    /* eslint-enable id-length */

    await client.close();
  });
};

module.exports = waitForMongodb;

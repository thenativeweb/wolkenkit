'use strict';

const uuid = require('uuidv4');

const getConnectionOptions = require('../../../shared/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { S3 } = require('../../../../storage/filestore');

suite('S3', () => {
  getTestsFor({
    Filestore: S3,

    getOptions () {
      const { minio } = getConnectionOptions({ type: 'integration' });

      return { ...minio, bucketName: uuid() };
    }
  });
});

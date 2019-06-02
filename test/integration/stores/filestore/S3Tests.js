'use strict';

const uuid = require('uuidv4');

const getConnectionOptions = require('../../../shared/containers/getConnectionOptions'),
      getTestsFor = require('./getTestsFor'),
      { S3 } = require('../../../../stores/filestore');

suite('S3', () => {
  getTestsFor({
    Filestore: S3,

    getOptions () {
      const { minio } = getConnectionOptions();

      return { ...minio, bucketName: uuid() };
    }
  });
});

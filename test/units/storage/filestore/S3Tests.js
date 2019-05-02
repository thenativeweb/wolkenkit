'use strict';

const getTestsFor = require('./getTestsFor'),
      { S3 } = require('../../../../storage/filestore');

suite('S3', () => {
  getTestsFor({
    Filestore: S3,
    type: 'S3'
  });
});

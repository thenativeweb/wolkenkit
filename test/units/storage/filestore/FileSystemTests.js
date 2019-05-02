'use strict';

const getTestsFor = require('./getTestsFor'),
      { FileSystem } = require('../../../../storage/filestore');

suite('FileSystem', () => {
  getTestsFor({
    Filestore: FileSystem,
    type: 'FileSystem'
  });
});

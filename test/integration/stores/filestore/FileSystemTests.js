'use strict';

const getTestsFor = require('./getTestsFor'),
      { FileSystem } = require('../../../../stores/filestore');

suite('FileSystem', () => {
  getTestsFor({
    Filestore: FileSystem,

    getOptions () {
      return {};
    }
  });
});

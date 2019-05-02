'use strict';

const { QueryList } = require('../elements');

const validateQueryList = function ({ queryList, application }) {
  if (!queryList) {
    throw new Error('Query list is missing.');
  }
  if (!application) {
    throw new Error('Application is missing.');
  }

  if (!QueryList.isWellformed(queryList)) {
    throw new Error('Malformed query list.');
  }

  if (!application.views.internal.lists[queryList.list.name]) {
    throw new Error('Invalid query list name.');
  }
};

module.exports = validateQueryList;

'use strict';

const ClientMetadata = require('../../../../common/utils/http/ClientMetadata'),
      { QueryList } = require('../../../../common/elements'),
      { validateQueryList } = require('../../../../common/validators');

const getQueryList = function ({ application, heartbeatInterval }) {
  if (!application) {
    throw new Error('Application is missing.');
  }
  if (!heartbeatInterval) {
    throw new Error('Heartbeat interval is missing.');
  }

  return async function (req, res) {
    const { listName } = req.params;
    const { where = {}, orderBy = {}} = req.query;
    let { skip = 0, take = 100 } = req.query;

    skip = Number(skip);
    take = Number(take);

    let queryList = {
      list: { name: listName },
      parameters: { where, orderBy, skip, take }
    };

    try {
      validateQueryList({ queryList, application });
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    queryList = QueryList.deserialize(queryList);

    // ...
  };
};

module.exports = getQueryList;

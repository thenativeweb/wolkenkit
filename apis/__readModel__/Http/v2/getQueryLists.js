'use strict';

const ClientMetadata = require('../ClientMetadata'),
      streamToClient = require('../streamToClient'),
      validateQueryLists = require('./validateQueryLists');

const getQueryLists = function ({ application, queryList, heartbeatInterval }) {
  if (!application) {
    throw new Error('Application is missing.');
  }
  if (!queryList) {
    throw new Error('Query list is missing.');
  }
  if (!heartbeatInterval) {
    throw new Error('Heartbeat interval is missing.');
  }

  const { readModel } = application.configuration;

  return async function (req, res) {
    const { listName } = req.params;
    let { where, orderBy, skip, take } = req.query;

    if (!readModel.lists[listName]) {
      return res.status(400).send(`Unknown list '${listName}'.`);
    }

    try {
      where = where ? JSON.parse(where) : {};
    } catch (ex) {
      return res.status(400).send('Invalid where.');
    }

    try {
      orderBy = orderBy ? JSON.parse(orderBy) : {};
    } catch (ex) {
      return res.status(400).send('Invalid order by.');
    }

    skip = Number(skip) || 0;
    take = Number(take) || 100;

    try {
      validateQueryLists({ where, orderBy, skip, take });
    } catch (ex) {
      return res.status(400).send('Invalid query.');
    }

    const clientMetadata = new ClientMetadata({ req });

    let stream;

    try {
      stream = await queryList({
        listName,
        metadata: { client: clientMetadata },
        query: { where, orderBy, take, skip }
      });
    } catch (ex) {
      return res.status(500).send('Unable to query list.');
    }

    await streamToClient({
      req,
      res,
      stream,
      heartbeatInterval,
      handle (item) {
        return item;
      }
    });
  };
};

module.exports = getQueryLists;

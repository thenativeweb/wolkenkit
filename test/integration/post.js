'use strict';

const containers = require('../shared/containers');

const post = async function () {
  await Promise.all([
    containers.consul.stop(),
    containers.mariaDb.stop(),
    containers.minio.stop(),
    containers.mongoDb.stop(),
    containers.mySql.stop(),
    containers.postgres.stop(),
    containers.rabbitMq.stop(),
    containers.sqlServer.stop()
  ]);
};

module.exports = post;

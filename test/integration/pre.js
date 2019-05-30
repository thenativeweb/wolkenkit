'use strict';

const buildImages = require('../../docker/buildImages'),
      containers = require('../shared/containers');

const pre = async function () {
  await buildImages();

  await Promise.all([
    containers.consul.start(),
    containers.mariaDb.start(),
    containers.minio.start(),
    containers.mongoDb.start(),
    containers.mySql.start(),
    containers.postgres.start(),
    containers.rabbitMq.start(),
    containers.sqlServer.start()
  ]);
};

module.exports = pre;

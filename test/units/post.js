'use strict';

const shell = require('shelljs');

const post = async function () {
  shell.exec([
    'docker kill mariadb-units',
    'docker kill mongodb-units',
    'docker kill mysql-units',
    'docker kill postgres-units',
    'docker kill sqlserver-units',
    'docker rm -v mariadb-units',
    'docker rm -v mongodb-units',
    'docker rm -v mysql-units',
    'docker rm -v postgres-units',
    'docker rm -v sqlserver-units'
  ].join(';'));
};

module.exports = post;

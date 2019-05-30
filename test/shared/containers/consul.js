'use strict';

const buntstift = require('buntstift'),
      getConsulClient = require('consul'),
      oneLine = require('common-tags/lib/oneLine'),
      retry = require('async-retry'),
      shell = require('shelljs');

const getConnectionOptions = require('./getConnectionOptions'),
      getRetryOptions = require('./getRetryOptions');

const consul = {
  async start () {
    const connectionOptions = getConnectionOptions();

    const {
      hostname,
      portApi,
      portDns,
      encryptConnection,
      externalDns
    } = connectionOptions.consul;

    shell.exec(oneLine`
      docker run
        -d
        -p ${portApi}:8500
        -p ${portDns}:8600
        -p ${portDns}:8600/udp
        -e "CONSUL_CLIENT_INTERFACE=eth0"
        -e "CONSUL_BIND_INTERFACE=eth0"
        --name test-consul
        thenativeweb/wolkenkit-consul:latest
        agent
        -dev
        -ui
        -recursor=${externalDns}
    `);

    const consulClient = getConsulClient({
      host: hostname,
      port: portApi,
      secure: encryptConnection,
      promisify: true
    });

    try {
      await retry(async () => {
        await consulClient.agent.service.list();
      }, getRetryOptions());
    } catch (ex) {
      buntstift.info(ex.message);
      buntstift.error('Failed to connect to Consul.');
      throw ex;
    }
  },

  async stop () {
    shell.exec([
      'docker kill test-consul',
      'docker rm -v test-consul'
    ].join(';'));
  }
};

module.exports = consul;

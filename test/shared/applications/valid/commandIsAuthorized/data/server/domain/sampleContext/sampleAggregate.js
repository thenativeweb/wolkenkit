'use strict';

const { initialState, commands, events } = require('../../../base/server/domain/sampleContext/sampleAggregate');

commands.authorizeWithMutation = {
  isAuthorized (sampleAggregate, command) {
    command.data.isMutated = true;

    return true;
  },

  handle () {}
};

commands.denyAuthorization = {
  isAuthorized () {
    return false;
  },

  handle () {}
};

commands.failToAuthorize = {
  isAuthorized () {
    throw new Error('Is authorized failed.');
  },

  handle () {}
};

commands.useApp = {
  async isAuthorized (sampleAggregate, command, { app }) {
    const { otherAggregateId } = command.data;

    const aggregate =
      await app.sampleContext.sampleAggregate(otherAggregateId).read();

    /* eslint-disable no-console */
    console.log(JSON.stringify(aggregate));
    /* eslint-enable no-console */

    return true;
  },

  handle () {}
};

commands.useClient = {
  isAuthorized (sampleAggregate, command, { client }) {
    /* eslint-disable no-console */
    console.log(JSON.stringify(client));
    /* eslint-enable no-console */

    return true;
  },

  handle () {}
};

commands.useLogger = {
  isAuthorized (sampleAggregate, command, { logger }) {
    const { logLevel } = command.data;

    logger[logLevel]('Some log message.');

    return true;
  },

  handle () {}
};

module.exports = { initialState, commands, events };

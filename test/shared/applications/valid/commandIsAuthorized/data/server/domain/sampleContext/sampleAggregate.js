'use strict';

const { initialState, commands, events } = require('../../../base/server/domain/sampleContext/sampleAggregate');

commands.authorizeWithMutation = {
  isAuthorized (sampleAggregate, command) {
    /* eslint-disable no-param-reassign */
    command.data.isMutated = true;
    /* eslint-enable no-param-reassign */

    return true;
  },

  handle () {
    // Intentionally left blank.
  }
};

commands.denyAuthorization = {
  isAuthorized () {
    return false;
  },

  handle () {
    // Intentionally left blank.
  }
};

commands.failToAuthorize = {
  isAuthorized () {
    throw new Error('Is authorized failed.');
  },

  handle () {
    // Intentionally left blank.
  }
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

  handle () {
    // Intentionally left blank.
  }
};

commands.useClient = {
  isAuthorized (sampleAggregate, command, { client }) {
    /* eslint-disable no-console */
    console.log(JSON.stringify(client));
    /* eslint-enable no-console */

    return true;
  },

  handle () {
    // Intentionally left blank.
  }
};

commands.useLogger = {
  isAuthorized (sampleAggregate, command, { logger }) {
    const { logLevel } = command.data;

    logger[logLevel]('Some log message.');

    return true;
  },

  handle () {
    // Intentionally left blank.
  }
};

module.exports = { initialState, commands, events };

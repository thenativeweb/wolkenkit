'use strict';

const { initialState, commands, events } = require('../../../base/server/domain/sampleContext/sampleAggregate');

events.authorizedWithMutation = {
  handle () {
    // Intentionally left blank.
  },

  isAuthorized (sampleAggregate, event) {
    /* eslint-disable no-param-reassign */
    event.data.isMutated = true;
    /* eslint-enable no-param-reassign */

    return true;
  }
};

events.authorizationDenied = {
  handle () {
    // Intentionally left blank.
  },

  isAuthorized () {
    return false;
  }
};

events.authorizationFailed = {
  handle () {
    // Intentionally left blank.
  },

  isAuthorized () {
    throw new Error('Is authorized failed.');
  }
};

events.useApp = {
  handle () {
    // Intentionally left blank.
  },

  async isAuthorized (sampleAggregate, event, { app }) {
    const { otherAggregateId } = event.data;

    const aggregate =
      await app.sampleContext.sampleAggregate(otherAggregateId).read();

    /* eslint-disable no-console */
    console.log(JSON.stringify(aggregate));
    /* eslint-enable no-console */

    return true;
  }
};

events.useClient = {
  handle () {
    // Intentionally left blank.
  },

  isAuthorized (sampleAggregate, event, { client }) {
    /* eslint-disable no-console */
    console.log(JSON.stringify(client));
    /* eslint-enable no-console */

    return true;
  }
};

events.useLogger = {
  handle () {
    // Intentionally left blank.
  },

  isAuthorized (sampleAggregate, event, { logger }) {
    const { logLevel } = event.data;

    logger[logLevel]('Some log message.');

    return true;
  }
};

module.exports = { initialState, commands, events };

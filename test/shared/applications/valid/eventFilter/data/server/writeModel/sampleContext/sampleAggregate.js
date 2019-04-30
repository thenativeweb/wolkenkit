'use strict';

const { initialState, commands, events } = require('../../../base/server/writeModel/sampleContext/sampleAggregate');

events.filteredWithMutation = {
  handle () {},

  isAuthorized () {
    return true;
  },

  filter (sampleAggregate, event) {
    event.data.isMutated = true;

    return true;
  }
};

events.filterDenied = {
  handle () {},

  isAuthorized () {
    return true;
  },

  filter () {
    return false;
  }
};

events.filterFailed = {
  handle () {},

  isAuthorized () {
    return true;
  },

  filter () {
    throw new Error('Filter failed.');
  }
};

events.useApp = {
  handle () {},

  isAuthorized () {
    return true;
  },

  async filter (sampleAggregate, event, { app }) {
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
  handle () {},

  isAuthorized () {
    return true;
  },

  filter (sampleAggregate, event, { client }) {
    /* eslint-disable no-console */
    console.log(JSON.stringify(client));
    /* eslint-enable no-console */

    return true;
  }
};

events.useLogger = {
  handle () {},

  isAuthorized () {
    return true;
  },

  filter (sampleAggregate, event, { logger }) {
    const { logLevel } = event.data;

    logger[logLevel]('Some log message.');

    return true;
  }
};

module.exports = { initialState, commands, events };

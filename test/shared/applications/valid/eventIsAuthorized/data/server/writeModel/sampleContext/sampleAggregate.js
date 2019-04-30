'use strict';

const { initialState, commands, events } = require('../../../base/server/writeModel/sampleContext/sampleAggregate');

events.authorizedWithMutation = {
  handle () {},

  isAuthorized (sampleAggregate, event) {
    event.data.isMutated = true;

    return true;
  }
};

events.authorizationDenied = {
  handle () {},

  isAuthorized () {
    return false;
  }
};

events.authorizationFailed = {
  handle () {},

  isAuthorized () {
    throw new Error('Is authorized failed.');
  }
};

events.useApp = {
  handle () {},

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
  handle () {},

  isAuthorized (sampleAggregate, event, { client }) {
    /* eslint-disable no-console */
    console.log(JSON.stringify(client));
    /* eslint-enable no-console */

    return true;
  }
};

events.useLogger = {
  handle () {},

  isAuthorized (sampleAggregate, event, { logger }) {
    const { logLevel } = event.data;

    logger[logLevel]('Some log message.');

    return true;
  }
};

module.exports = { initialState, commands, events };

'use strict';

const { initialState, commands, events } = require('../../../base/server/domain/sampleContext/sampleAggregate');

events.mapApplied = {
  handle () {},

  isAuthorized () {
    return true;
  },

  map (sampleAggregate, event) {
    return { ...event, data: { ...event.data, isMapped: true }};
  }
};

events.mapAppliedWithMutation = {
  handle () {},

  isAuthorized () {
    return true;
  },

  map (sampleAggregate, event) {
    event.data.isMutated = true;

    return event;
  }
};

events.mapDenied = {
  handle () {},

  isAuthorized () {
    return true;
  },

  map () {
    /* eslint-disable no-useless-return */
    // Explicitly return nothing, so that the event gets filtered out.
    return;
    /* eslint-enable no-useless-return */
  }
};

events.mapFailed = {
  handle () {},

  isAuthorized () {
    return true;
  },

  map () {
    throw new Error('Map failed.');
  }
};

events.useApp = {
  handle () {},

  isAuthorized () {
    return true;
  },

  async map (sampleAggregate, event, { app }) {
    const { otherAggregateId } = event.data;

    const aggregate =
      await app.sampleContext.sampleAggregate(otherAggregateId).read();

    /* eslint-disable no-console */
    console.log(JSON.stringify(aggregate));
    /* eslint-enable no-console */

    return event;
  }
};

events.useClient = {
  handle () {},

  isAuthorized () {
    return true;
  },

  map (sampleAggregate, event, { client }) {
    /* eslint-disable no-console */
    console.log(JSON.stringify(client));
    /* eslint-enable no-console */

    return event;
  }
};

events.useLogger = {
  handle () {},

  isAuthorized () {
    return true;
  },

  map (sampleAggregate, event, { logger }) {
    const { logLevel } = event.data;

    logger[logLevel]('Some log message.');

    return event;
  }
};

module.exports = { initialState, commands, events };

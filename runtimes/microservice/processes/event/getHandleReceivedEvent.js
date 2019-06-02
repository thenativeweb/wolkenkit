'use strict';

const flaschenpost = require('flaschenpost');

const errors = require('../../../../common/errors');

const logger = flaschenpost.getLogger();

const getHandleReceivedEvent = function ({ eventHttpExternal }) {
  if (!eventHttpExternal) {
    throw new Error('Event http external is missing.');
  }

  return async function ({ event }) {
    if (!event) {
      throw new Error('Event is missing.');
    }

    try {
      await eventHttpExternal.sendEvent({ event });

      logger.info('Event forwarded to external API.', { event });
    } catch (ex) {
      logger.error('Failed to forward event to external API.', { event, ex });

      throw new errors.ForwardFailed();
    }
  };
};

module.exports = getHandleReceivedEvent;

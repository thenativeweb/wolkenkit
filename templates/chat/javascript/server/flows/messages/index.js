'use strict';

const { handleMessageLiked } = require('./handlers/handleMessageLiked'),
      { handleMessageSent } = require('./handlers/handleMessageSent');

const messages = {
  replayPolicy: 'always',

  domainEventHandlers: {
    handleMessageSent,
    handleMessageLiked
  }
};

module.exports = messages;

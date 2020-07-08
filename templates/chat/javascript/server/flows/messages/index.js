'use strict';

const { handleMessageLiked } = require('./handlers/handleMessageLiked');
const { handleMessageSent } = require('./handlers/handleMessageSent');

const messages = {
  replayPolicy: 'always',

  domainEventHandlers: {
    handleMessageSent,
    handleMessageLiked
  }
};

module.exports = messages;

'use strict';

const { getInitialState } = require('./MessageState');
const { like } = require('./commands/like');
const { liked } = require('./domainEvents/liked');
const { send } = require('./commands/send');
const { sent } = require('./domainEvents/sent');

const message = {
  getInitialState,
  commandHandlers: {
    send,
    like
  },
  domainEventHandlers: {
    sent,
    liked
  }
};

module.exports = message;

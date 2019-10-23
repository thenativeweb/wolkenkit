'use strict';

const { handler: Open } = require('./commands/Open');
const { handler: Opened } = require('./domainEvents/Opened');
const { State } = require('./State');

module.exports = {
  State,
  commands: { Open },
  domainEvents: { Opened }
};

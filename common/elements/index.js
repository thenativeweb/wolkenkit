'use strict';

const AggregateReadable = require('./AggregateReadable'),
      AggregateWriteable = require('./AggregateWriteable'),
      CommandExternal = require('./CommandExternal'),
      CommandInternal = require('./CommandInternal'),
      EventExternal = require('./EventExternal'),
      EventInternal = require('./EventInternal');

module.exports = {
  AggregateReadable,
  AggregateWriteable,
  CommandExternal,
  CommandInternal,
  EventExternal,
  EventInternal
};

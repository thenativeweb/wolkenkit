'use strict';

const { initialState, commands, events } = require('../../../base/server/writeModel/sampleContext/sampleAggregate');

initialState.events = [];

events.succeeded.handle = function (sampleAggregate, event) {
  sampleAggregate.setState({
    events: [ ...sampleAggregate.state.events, event.name ]
  });
};

events.executed.handle = function (sampleAggregate, event) {
  sampleAggregate.setState({
    events: [ ...sampleAggregate.state.events, event.name ]
  });
};

module.exports = { initialState, commands, events };

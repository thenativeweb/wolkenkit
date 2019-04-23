'use strict';

const initialState = {
  sampleState: undefined,
  isAuthorized: {
    commands: {
      sampleCommand: { forPublic: true }
    },
    events: {
      sampleEvent: { forPublic: true }
    }
  }
};

const commands = {
  async sampleCommand (sampleAggregate, command) {
    sampleAggregate.events.publish('sampleEvent', {
      // ...
    });
  }
};

const events = {
  sampleEvent (sampleAggregate, event) {
    sampleAggregate.setState({
      // ...
    });
  }
};

module.exports = { initialState, commands, events };

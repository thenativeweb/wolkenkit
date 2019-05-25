'use strict';

const cloneDeep = require('lodash/cloneDeep');

class AggregateReadable {
  constructor ({ application, context, aggregate }) {
    if (!application) {
      throw new Error('Application is missing.');
    }
    if (!context) {
      throw new Error('Context is missing.');
    }
    if (!context.name) {
      throw new Error('Context name is missing.');
    }
    if (!aggregate) {
      throw new Error('Aggregate is missing.');
    }
    if (!aggregate.name) {
      throw new Error('Aggregate name is missing.');
    }
    if (!aggregate.id) {
      throw new Error('Aggregate id is missing.');
    }

    if (!application.initialState.internal[context.name]) {
      throw new Error('Context does not exist.');
    }
    if (!application.initialState.internal[context.name][aggregate.name]) {
      throw new Error('Aggregate does not exist.');
    }

    this.instance = {};
    this.instance.context = { name: context.name };
    this.instance.name = aggregate.name;
    this.instance.id = aggregate.id;
    this.instance.revision = 0;
    this.instance.uncommittedEvents = [];
    this.instance.exists = () =>
      this.instance.revision > 0;

    this.api = {};
    this.api.forReadOnly = {};
    this.api.forReadOnly.id = aggregate.id;
    this.api.forReadOnly.state =
      cloneDeep(application.initialState.internal[context.name][aggregate.name]);
    this.api.forReadOnly.exists = this.instance.exists;

    this.api.forEvents = {};
    this.api.forEvents.id = this.api.forReadOnly.id;
    this.api.forEvents.state = this.api.forReadOnly.state;
    this.api.forEvents.setState = newState => {
      for (const [ key, value ] of Object.entries(newState)) {
        this.api.forEvents.state[key] = value;
      }
    };
  }

  applySnapshot ({ snapshot }) {
    if (!snapshot) {
      throw new Error('Snapshot is missing.');
    }

    this.instance.revision = snapshot.revision;
    this.api.forReadOnly.state = snapshot.state;
    this.api.forEvents.state = snapshot.state;
  }

  async applyEventStream ({ application, eventStream }) {
    if (!application) {
      throw new Error('Application is missing.');
    }
    if (!eventStream) {
      throw new Error('Event stream is missing.');
    }

    for await (const event of eventStream) {
      if (event.context.name !== this.instance.context.name) {
        throw new Error('Context name does not match.');
      }
      if (event.aggregate.name !== this.instance.name) {
        throw new Error('Aggregate name does not match.');
      }
      if (event.aggregate.id !== this.instance.id) {
        throw new Error('Aggregate id does not match.');
      }
      if (
        !application.events.internal[this.instance.context.name][this.instance.name][event.name]
      ) {
        throw new Error('Unknown event.');
      }

      const { handle } =
        application.events.internal[this.instance.context.name][this.instance.name][event.name];

      handle(this.api.forEvents, event);

      this.instance.revision = event.metadata.revision.aggregate;
    }
  }
}

module.exports = AggregateReadable;

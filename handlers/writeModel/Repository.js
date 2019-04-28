'use strict';

const { ReadableAggregate, WritableAggregate } = require('../../common/elements');

class Repository {
  constructor ({ application, eventstore }) {
    if (!application) {
      throw new Error('Application is missing.');
    }
    if (!eventstore) {
      throw new Error('Event store is missing.');
    }

    const { writeModel } = application;

    this.writeModel = writeModel;
    this.eventstore = eventstore;
  }

  async replayAggregate ({ aggregate }) {
    if (!aggregate) {
      throw new Error('Aggregate is missing.');
    }

    const snapshot = await this.eventstore.getSnapshot(aggregate.instance.id);

    let fromRevision = 1;

    if (snapshot) {
      aggregate.applySnapshot(snapshot);
      fromRevision = snapshot.revision + 1;
    }

    const eventStream = await this.eventstore.getEventStream({
      aggregateId: aggregate.instance.id,
      fromRevision
    });

    for await (const event of eventStream) {
      if (!aggregate.definition.events[event.name]) {
        throw new Error('Aggregate not found.');
      }

      aggregate.definition.events[event.name].handle(aggregate.api.forEvents, event);
      aggregate.instance.revision = event.metadata.revision;
    }

    return aggregate;
  }

  async loadAggregate ({ contextName, aggregateName, aggregateId }) {
    if (!contextName) {
      throw new Error('Context name is missing.');
    }
    if (!aggregateName) {
      throw new Error('Aggregate name is missing.');
    }
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const aggregate = new ReadableAggregate({
      app: this.app,
      writeModel: this.writeModel,
      context: { name: contextName },
      aggregate: { name: aggregateName, id: aggregateId }
    });

    const replayedAggregate = await this.replayAggregate({ aggregate });

    return replayedAggregate;
  }

  async loadAggregateForCommand ({ command }) {
    if (!command) {
      throw new Error('Command is missing.');
    }

    const aggregate = new WritableAggregate({
      writeModel: this.writeModel,
      context: { name: command.context.name },
      aggregate: { name: command.aggregate.name, id: command.aggregate.id },
      command
    });

    const replayedAggregate = await this.replayAggregate({ aggregate });

    return replayedAggregate;
  }

  async saveAggregate ({ aggregate }) {
    if (!aggregate) {
      throw new Error('Aggregate is missing.');
    }

    if (aggregate.instance.uncommittedEvents.length === 0) {
      return [];
    }

    const committedEvents = await this.eventstore.saveEvents({
      uncommittedEvents: aggregate.instance.uncommittedEvents
    });

    return committedEvents;
  }
}

module.exports = Repository;

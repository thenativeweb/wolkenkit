'use strict';

const { AggregateReadable, AggregateWriteable } = require('../elements');

class Repository {
  constructor ({ application, eventstore }) {
    if (!application) {
      throw new Error('Application is missing.');
    }
    if (!eventstore) {
      throw new Error('Event store is missing.');
    }

    this.application = application;
    this.eventstore = eventstore;
  }

  async replayAggregate ({ aggregate }) {
    if (!aggregate) {
      throw new Error('Aggregate is missing.');
    }

    const snapshot = await this.eventstore.getSnapshot({
      aggregateId: aggregate.instance.id
    });

    let fromRevision = 1;

    if (snapshot) {
      aggregate.applySnapshot({ snapshot });
      fromRevision = snapshot.revision + 1;
    }

    const eventStream = await this.eventstore.getEventStream({
      aggregateId: aggregate.instance.id,
      fromRevision
    });

    await aggregate.applyEventStream({
      application: this.application,
      eventStream
    });

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

    const aggregate = new AggregateReadable({
      application: this.application,
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

    const aggregate = new AggregateWriteable({
      application: this.application,
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

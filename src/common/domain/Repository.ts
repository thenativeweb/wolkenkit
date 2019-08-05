import Aggregate from '../elements/Aggregate';
import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import Application from '../application/Application';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import errors from '../errors';
import EventInternal from '../elements/EventInternal';
import { Eventstore } from '../../stores/eventstore/Eventstore';

class Repository {
  protected application: Application;

  protected eventstore: Eventstore;

  public constructor ({ application, eventstore }: {
    application: Application;
    eventstore: Eventstore;
  }) {
    this.application = application;
    this.eventstore = eventstore;
  }

  protected async replayAggregate ({ aggregate }: {
    aggregate: Aggregate;
  }): Promise<Aggregate> {
    const snapshot = await this.eventstore.getSnapshot({
      aggregateIdentifier: aggregate.identifier
    });

    let fromRevision = 1;

    if (snapshot) {
      aggregate.applySnapshot({ snapshot });
      fromRevision = snapshot.revision + 1;
    }

    const eventStream = await this.eventstore.getEventStream({
      aggregateIdentifier: aggregate.identifier,
      fromRevision
    });

    await aggregate.applyEventStream({
      application: this.application,
      eventStream
    });

    return aggregate;
  }

  public async loadAggregate ({ contextIdentifier, aggregateIdentifier }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Aggregate> {
    const contextState = this.application.initialState.internal[contextIdentifier.name];

    if (!contextState) {
      throw new errors.IdentifierMismatch();
    }

    const initialState = contextState[aggregateIdentifier.name];

    if (!initialState) {
      throw new errors.IdentifierMismatch();
    }

    const aggregate = new Aggregate({
      contextIdentifier,
      aggregateIdentifier,
      initialState
    });

    const replayedAggregate = await this.replayAggregate({ aggregate });

    return replayedAggregate;
  }

  async saveAggregate ({ aggregate }: {
    aggregate: Aggregate;
  }): Promise<EventInternal[]> {
    if (aggregate.uncommittedEvents.length === 0) {
      return [];
    }

    const committedEvents = await this.eventstore.saveEvents({
      uncommittedEvents: aggregate.uncommittedEvents
    });

    return committedEvents;
  }
}

export default Repository;

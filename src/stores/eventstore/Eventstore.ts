import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import EventExternal from '../../common/elements/EventExternal';
import EventInternal from '../../common/elements/EventInternal';
import { PassThrough } from 'stream';
import { Snapshot } from './Snapshot';

// All PassThrough streams here emit objects of type EventExternal.
export interface Eventstore {
  destroy: () => Promise<void>;

  getEventStream: ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision?: number;
    toRevision?: number;
  }) => Promise<PassThrough>;

  getLastEvent: ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<EventExternal | undefined>;

  getReplay: ({ fromRevisionGlobal, toRevisionGlobal }?: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  }) => Promise<PassThrough>;

  getSnapshot: ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<Snapshot | undefined>;

  getUnpublishedEventStream: () => Promise<PassThrough>;

  markEventsAsPublished: ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }) => Promise<void>;

  saveEvents: ({ uncommittedEvents }: {
    uncommittedEvents: EventInternal[];
  }) => Promise<EventInternal[]>;

  saveSnapshot: ({ snapshot }: {
    snapshot: Snapshot;
  }) => Promise<void>;
}

import PQueue from 'p-queue';

export declare type RoutingKey = any;
export declare type TaskId = any;

export declare interface TaskIdentity {
  routingKey: RoutingKey;
  id: TaskId;
}

export declare interface Track {
  tasks: TaskIdentity[];
  queue: PQueue;
}

declare class Course {
  public constructor(args?: {
    trackCount?: number;
    concurrencyPerTrack?: number;
  });

  public static findBestTrackForRoutingKey(args?: {
    tracks: Track[];
    routingKey: RoutingKey;
  }): Track;

  public add(args: {
    routingKey: RoutingKey;
    id: TaskId;
    task: Function;
  }): Promise<void>
}

export default Course;

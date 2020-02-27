import { EventEmitter, on } from 'events';

class SpecializedEventEmitter<TEventData> {
  protected eventEmitter: EventEmitter;

  protected static readonly eventName = 'event';

  public constructor () {
    this.eventEmitter = new EventEmitter();
  }

  public emit (eventData: TEventData): void {
    this.eventEmitter.emit(SpecializedEventEmitter.eventName, eventData);
  }

  public on (eventHandler: (eventData: TEventData) => void): void {
    this.eventEmitter.on(SpecializedEventEmitter.eventName, eventHandler);
  }

  public once (eventHandler: (eventData: TEventData) => void): void {
    this.eventEmitter.once(SpecializedEventEmitter.eventName, eventHandler);
  }

  public off (eventHandler: (eventData: TEventData) => void): void {
    this.eventEmitter.off(SpecializedEventEmitter.eventName, eventHandler);
  }

  public removeAllListeners (): void {
    this.eventEmitter.removeAllListeners(SpecializedEventEmitter.eventName);
  }

  public asyncIterator (): AsyncIterator<[TEventData]> {
    return on(this.eventEmitter, SpecializedEventEmitter.eventName);
  }

  // eslint-disable-next-line @typescript-eslint/member-naming
  public [Symbol.asyncIterator] (): AsyncIterator<[TEventData]> {
    return on(this.eventEmitter, SpecializedEventEmitter.eventName);
  }
}

export { SpecializedEventEmitter };

/// <reference types="node" />
import { EventEmitter } from 'events';
declare class SpecializedEventEmitter<TEventData> {
    protected eventEmitter: EventEmitter;
    protected static readonly eventName = "event";
    constructor();
    emit(eventData: TEventData): void;
    on(eventHandler: (eventData: TEventData) => void): void;
    once(eventHandler: (eventData: TEventData) => void): void;
    off(eventHandler: (eventData: TEventData) => void): void;
    removeAllListeners(): void;
    asyncIterator(): AsyncIterator<[TEventData]>;
    [Symbol.asyncIterator](): AsyncIterator<[TEventData]>;
}
export { SpecializedEventEmitter };

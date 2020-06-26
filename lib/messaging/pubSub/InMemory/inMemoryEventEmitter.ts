import { EventEmitter2 } from 'eventemitter2';

const inMemoryEventEmitter = new EventEmitter2({
  wildcard: true
});

export { inMemoryEventEmitter };

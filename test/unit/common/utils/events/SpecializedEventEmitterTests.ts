import { assert } from 'assertthat';
import { SpecializedEventEmitter } from '../../../../../lib/common/utils/events/SpecializedEventEmitter';

interface Event {
  foo: number;
  bar: number;
}

suite('SpecializedEventEmitter', (): void => {
  let specializedEventEmitter: SpecializedEventEmitter<Event>;

  setup(async (): Promise<void> => {
    specializedEventEmitter = new SpecializedEventEmitter<Event>();
  });

  suite('emit', (): void => {
    test('emits events.', async (): Promise<void> => {
      let counter = 0;

      specializedEventEmitter.on((event): void => {
        assert.that(event).is.equalTo({ foo: 23, bar: 42 });
        counter += 1;
      });

      specializedEventEmitter.emit({ foo: 23, bar: 42 });

      assert.that(counter).is.equalTo(1);
    });
  });

  suite('once', (): void => {
    test('handles events once.', async (): Promise<void> => {
      let counter = 0;

      specializedEventEmitter.once((): void => {
        counter += 1;
      });

      specializedEventEmitter.emit({ foo: 23, bar: 42 });
      specializedEventEmitter.emit({ foo: 23, bar: 42 });

      assert.that(counter).is.equalTo(1);
    });
  });

  suite('off', (): void => {
    test('unsubscribes from events.', async (): Promise<void> => {
      let counter = 0;

      const eventHandler = (): void => {
        counter += 1;
      };

      specializedEventEmitter.on(eventHandler);
      specializedEventEmitter.emit({ foo: 23, bar: 42 });

      specializedEventEmitter.off(eventHandler);
      specializedEventEmitter.emit({ foo: 23, bar: 42 });

      assert.that(counter).is.equalTo(1);
    });
  });

  suite('removeAllListeners', (): void => {
    test('unsubscribes from events.', async (): Promise<void> => {
      let counter = 0;

      const eventHandler = (): void => {
        counter += 1;
      };

      specializedEventEmitter.on(eventHandler);
      specializedEventEmitter.emit({ foo: 23, bar: 42 });

      specializedEventEmitter.removeAllListeners();
      specializedEventEmitter.emit({ foo: 23, bar: 42 });

      assert.that(counter).is.equalTo(1);
    });
  });
});

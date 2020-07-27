import { assert } from 'assertthat';
import { mapKeysDeep } from '../../../../lib/common/utils/mapKeysDeep';

suite('mapKeysDeep', (): void => {
  test('returns the given object with mapped keys.', async (): Promise<void> => {
    const mappedObject = mapKeysDeep({
      foo: 'bar',
      bar: 23
    }, (_value, key): string => key.toUpperCase());

    assert.that(mappedObject).is.equalTo({
      FOO: 'bar',
      BAR: 23
    });
  });

  test('recursively maps keys.', async (): Promise<void> => {
    const mappedObject = mapKeysDeep({
      foo: 'bar',
      bar: {
        baz: 23
      }
    }, (_value, key): string => key.toUpperCase());

    assert.that(mappedObject).is.equalTo({
      FOO: 'bar',
      BAR: {
        BAZ: 23
      }
    });
  });

  test('correctly handles array.', async (): Promise<void> => {
    const mappedObject = mapKeysDeep({
      foo: 'bar',
      bar: [ 23, 42 ]
    }, (_value, key): string => key.toUpperCase());

    assert.that(mappedObject).is.equalTo({
      FOO: 'bar',
      BAR: [ 23, 42 ]
    });
  });

  test('ignores non-objects.', async (): Promise<void> => {
    const mappedObject = mapKeysDeep(23, (_value, key): string => key.toUpperCase());

    assert.that(mappedObject).is.equalTo(23);
  });
});

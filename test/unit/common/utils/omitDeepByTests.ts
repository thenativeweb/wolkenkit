import { assert } from 'assertthat';
import { omitDeepBy } from '../../../../lib/common/utils/omitDeepBy';

suite('omitDeepBy', (): void => {
  test('returns the value if it is not an object.', async (): Promise<void> => {
    assert.that(omitDeepBy(23, (value: any): boolean => value)).is.equalTo(23);
  });

  test('returns the value even for falsy values.', async (): Promise<void> => {
    assert.that(omitDeepBy(0, (value: any): boolean => value)).is.equalTo(0);
  });

  test('returns the value even for undefined.', async (): Promise<void> => {
    assert.that(omitDeepBy(undefined, (value: any): boolean => value)).is.undefined();
  });

  test('returns the value if it is an object.', async (): Promise<void> => {
    assert.that(omitDeepBy({ foo: 'bar' }, (value: any): boolean => value === undefined)).is.equalTo({ foo: 'bar' });
  });

  test('omits properties that fulfill the predicate.', async (): Promise<void> => {
    assert.that(omitDeepBy({ foo: 'bar', bar: 'baz' }, (value: any): boolean => value === 'bar')).is.equalTo({ bar: 'baz' });
  });

  test('omits undefined, but not null, if predicate checks for undefined.', async (): Promise<void> => {
    assert.that(omitDeepBy({ foo: null, bar: undefined }, (value: any): boolean => value === undefined)).is.equalTo({ foo: null });
  });

  test('correctly handles empty arrays.', async (): Promise<void> => {
    assert.that(omitDeepBy({ bar: 'baz', foo: []}, (value: any): boolean => value === undefined)).is.equalTo({ bar: 'baz', foo: []});
  });
});

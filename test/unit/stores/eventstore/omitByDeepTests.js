'use strict';

const assert = require('assertthat');

const omitByDeep = require('../../../../stores/eventstore/omitByDeep');

suite('omitByDeep', () => {
  test('is a function.', async () => {
    assert.that(omitByDeep).is.ofType('function');
  });

  test('throws an error if predicate is missing.', async () => {
    assert.that(() => {
      omitByDeep(23);
    }).is.throwing('Predicate is missing.');
  });

  test('returns the value if it is not an object.', async () => {
    assert.that(omitByDeep(23, value => value)).is.equalTo(23);
  });

  test('returns the value even for falsy values.', async () => {
    assert.that(omitByDeep(0, value => value)).is.equalTo(0);
  });

  test('returns the value even for undefined.', async () => {
    assert.that(omitByDeep(undefined, value => value)).is.undefined();
  });

  test('returns the value if it is an object.', async () => {
    assert.that(omitByDeep({ foo: 'bar' }, value => value === undefined)).is.equalTo({ foo: 'bar' });
  });

  test('omits properties that fulfill the predicate.', async () => {
    assert.that(omitByDeep({ foo: 'bar', bar: 'baz' }, value => value === 'bar')).is.equalTo({ bar: 'baz' });
  });

  test('omits undefined, but not null, if predicate checks for undefined.', async () => {
    assert.that(omitByDeep({ foo: null, bar: undefined }, value => value === undefined)).is.equalTo({ foo: null });
  });

  test('correctly handles empty arrays.', async () => {
    assert.that(omitByDeep({ bar: 'baz', foo: []}, value => value === undefined)).is.equalTo({ bar: 'baz', foo: []});
  });
});

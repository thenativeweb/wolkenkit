'use strict';

const assert = require('assertthat');

const sortObjectKeys = require('../../../../stores/lockstore/sortObjectKeys');

suite('sortObjectKeys', () => {
  suite('default behavior', () => {
    test('does not sort object keys.', async () => {
      const value = {
        third: 'third field',
        second: 'second field',
        first: 'first field'
      };

      const expected = '{"third":"third field","second":"second field","first":"first field"}';
      const actual = JSON.stringify(value);

      assert.that(actual).is.equalTo(expected);
    });
  });

  test('is a function.', async () => {
    assert.that(sortObjectKeys).is.ofType('function');
  });

  test('returns an array as it is.', async () => {
    const value = sortObjectKeys({ object: [ 3, 2, 1 ]});

    const expected = '[3,2,1]';
    const actual = JSON.stringify(value);

    assert.that(actual).is.equalTo(expected);
  });

  test('returns any other value as it is.', async () => {
    const value = sortObjectKeys({ object: 'some non object value' });

    const expected = '"some non object value"';
    const actual = JSON.stringify(value);

    assert.that(actual).is.equalTo(expected);
  });

  test('sorts object keys.', async () => {
    const object = {
      third: 'third field',
      second: 'second field',
      first: 'first field'
    };
    const value = sortObjectKeys({ object });

    const expected = '{"first":"first field","second":"second field","third":"third field"}';
    const actual = JSON.stringify(value);

    assert.that(actual).is.equalTo(expected);
  });

  test('sorts recursively.', async () => {
    const object = {
      third: { secondNested: 'second nested field', firstNested: 'first nested field' },
      second: 'second field',
      first: 'first field'
    };
    const value = sortObjectKeys({ object, recursive: true });

    const expected = '{"first":"first field","second":"second field","third":{"firstNested":"first nested field","secondNested":"second nested field"}}';
    const actual = JSON.stringify(value);

    assert.that(actual).is.equalTo(expected);
  });
});

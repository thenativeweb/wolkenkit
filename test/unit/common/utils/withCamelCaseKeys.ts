import { assert } from 'assertthat';
import { withCamelCaseKeys } from '../../../../lib/common/utils/withCamelCaseKeys';

suite('withCamelCaseKeys', (): void => {
  test('it does not do anything to an empty object.', async (): Promise<void> => {
    assert.that(withCamelCaseKeys({})).is.equalTo({});
  });

  test('it converts all keys in an object to camel case.', async (): Promise<void> => {
    const object = {
      foo: 'foo',
      FOO_BAR: 'fooBar',
      FOOBAZ: 'foobaz',
      FOO_BAR_BAZ: 'fooBarBaz'
    };

    assert.that(object).is.equalTo({
      foo: 'foo',
      fooBar: 'fooBar',
      foobaz: 'foobaz',
      fooBarBaz: 'fooBarBaz'
    });
  });
});

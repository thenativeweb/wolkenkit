import { arrayToSentence } from '../../../../lib/common/utils/arrayToSentence';
import { assert } from 'assertthat';

suite('arrayToSentence', (): void => {
  test('returns an empty string for an empty array.', async (): Promise<void> => {
    assert.that(arrayToSentence({
      data: [],
      conjunction: 'and'
    })).is.equalTo('');
  });

  test('returns a string without commas and conjunction for an array with a single element.', async (): Promise<void> => {
    assert.that(arrayToSentence({
      data: [ 'red' ],
      conjunction: 'and'
    })).is.equalTo('red');
  });

  test('returns a string with a conjunction for an array with two elements.', async (): Promise<void> => {
    assert.that(arrayToSentence({
      data: [ 'red', 'green' ],
      conjunction: 'and'
    })).is.equalTo('red and green');
  });

  test('returns a string with commas and a conjunction for an array with more than two elements.', async (): Promise<void> => {
    assert.that(arrayToSentence({
      data: [ 'red', 'green', 'blue' ],
      conjunction: 'and'
    })).is.equalTo('red, green, and blue');
  });

  test('uses the given prefix and suffix.', async (): Promise<void> => {
    assert.that(arrayToSentence({
      data: [ 'red', 'green', 'blue' ],
      conjunction: 'and',
      itemPrefix: 'PREFIX',
      itemSuffix: 'SUFFIX'
    })).is.equalTo('PREFIXredSUFFIX, PREFIXgreenSUFFIX, and PREFIXblueSUFFIX');
  });
});

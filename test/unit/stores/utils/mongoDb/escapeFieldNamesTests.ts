import { assert } from 'assertthat';
import { escapeFieldNames } from '../../../../../lib/stores/utils/mongoDb/escapeFieldNames';

suite('escapeFieldNames', (): void => {
  test('returns the given object with escaped keys.', async (): Promise<void> => {
    const escaped = escapeFieldNames({
      foo: 23,
      'bar.baz': {
        $bas: 42
      },
      '\\.$': 7,
      'https://invalid.token/is-anonymous': true
    });

    assert.that(escaped).is.equalTo({
      foo: 23,
      'bar\\dotbaz': {
        '\\dollarbas': 42
      },
      '\\\\\\dot\\dollar': 7,
      'https://invalid\\dottoken/is-anonymous': true
    });
  });
});

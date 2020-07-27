import { assert } from 'assertthat';
import { unescapeFieldNames } from '../../../../../lib/stores/utils/mongoDb/escapeFieldNames';

suite('unescapeFieldNames', (): void => {
  test('returns the given object with unescaped keys.', async (): Promise<void> => {
    const escaped = unescapeFieldNames({
      foo: 23,
      'bar\\dotbaz': {
        '\\dollarbas': 42
      },
      '\\\\\\dot\\dollar': 7
    });

    assert.that(escaped).is.equalTo({
      foo: 23,
      'bar.baz': {
        $bas: 42
      },
      '\\.$': 7
    });
  });
});

import { assert } from 'assertthat';

import { sortKeys } from '../../../../lib/common/utils/sortKeys';

suite('sortKeys', (): void => {
  test('sorts the keys of a shallow object.', async (): Promise<void> => {
    const value = {
      bb: 'b',
      aa: 'a',
      cc: 'c'
    };
    const sorted = sortKeys({ object: value });

    assert.that(Object.keys(sorted)).is.equalTo([ 'aa', 'bb', 'cc' ]);
  });

  test('sorts only the outer most keys of a nested object.', async (): Promise<void> => {
    const value = {
      bb: 'b',
      aa: {
        dd: 'd',
        bb: 'b'
      },
      cc: 'c'
    };
    const sorted = sortKeys({ object: value });

    assert.that(Object.keys(sorted)).is.equalTo([ 'aa', 'bb', 'cc' ]);
    assert.that(Object.keys(sorted.aa)).is.equalTo([ 'dd', 'bb' ]);
  });

  test('sorts recursively if instructed to do so.', async (): Promise<void> => {
    const value = {
      bb: 'b',
      aa: {
        dd: 'd',
        bb: 'b'
      },
      cc: 'c'
    };
    const sorted = sortKeys({ object: value, recursive: true });

    assert.that(Object.keys(sorted)).is.equalTo([ 'aa', 'bb', 'cc' ]);
    assert.that(Object.keys(sorted.aa)).is.equalTo([ 'bb', 'dd' ]);
  });
});

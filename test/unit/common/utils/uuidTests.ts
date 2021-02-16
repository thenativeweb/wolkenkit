import { assert } from 'assertthat';
import { regex } from '../../../../lib/common/utils/uuid';
import { v4 } from 'uuid';

suite('uuid', (): void => {
  suite('regex', (): void => {
    let uuid: string;

    setup(async (): Promise<void> => {
      uuid = v4();
    });

    test('is a regular expression that matches a UUID v4.', async (): Promise<void> => {
      assert.that(uuid).is.matching(regex);
    });

    test('is a regular expression that correctly matches the start of a UUID v4.', async (): Promise<void> => {
      assert.that(`31${uuid}`).is.not.matching(regex);
    });

    test('is a regular expression that correctly matches the end of a UUID v4.', async (): Promise<void> => {
      assert.that(`${uuid}31`).is.not.matching(regex);
    });
  });
});

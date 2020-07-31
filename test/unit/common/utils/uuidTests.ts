import { assert } from 'assertthat';
import { v4 } from 'uuid';
import { jsonSchema, regex } from '../../../../lib/common/utils/uuid';

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

  suite('jsonSchema', (): void => {
    test('is based on the regex.', async (): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      assert.that(jsonSchema).is.equalTo({ type: 'string', pattern: regex.toString().slice(1, -2) });
    });
  });
});

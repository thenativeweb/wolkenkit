import { addMissingPrototype } from '../../../../../lib/common/utils/graphql/addMissingPrototype';
import { assert } from 'assertthat';

suite('addMissingPrototype', (): void => {
  test('adds a prototype if the prototype is null.', async (): Promise<void> => {
    const withoutPrototype = Object.create(null);

    assert.that(withoutPrototype.hasOwnProperty).is.undefined();

    const withPrototype = addMissingPrototype({ value: withoutPrototype });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    assert.that(withPrototype.hasOwnProperty).is.ofType('function');
  });
});

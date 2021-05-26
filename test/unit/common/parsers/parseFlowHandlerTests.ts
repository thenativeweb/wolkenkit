import { assert } from 'assertthat';
import { parseFlowHandler } from '../../../../lib/common/parsers/parseFlowHandler';

suite('parseFlowHandler', (): void => {
  const domainEventHandler = {
    isRelevant (): boolean {
      return true;
    },
    handle (): void {
      // Intentionally left blank.
    }
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseFlowHandler({ domainEventHandler })
    ).is.not.anError();
  });

  test('returns an error if the given domain event handler is not an object.', async (): Promise<void> => {
    assert.that(
      parseFlowHandler({ domainEventHandler: undefined })
    ).is.anErrorWithMessage(`Property 'domainEventHandler' is not an object.`);
  });

  test('returns an error if is relevant is missing.', async (): Promise<void> => {
    assert.that(
      parseFlowHandler({ domainEventHandler: {
        ...domainEventHandler,
        isRelevant: undefined
      }})
    ).is.anErrorWithMessage(`Function 'isRelevant' is missing.`);
  });

  test('returns an error if is relevant is not a function.', async (): Promise<void> => {
    assert.that(
      parseFlowHandler({ domainEventHandler: {
        ...domainEventHandler,
        isRelevant: {}
      }})
    ).is.anErrorWithMessage(`Property 'isRelevant' is not a function.`);
  });

  test('returns an error if handle is missing.', async (): Promise<void> => {
    assert.that(
      parseFlowHandler({ domainEventHandler: {
        ...domainEventHandler,
        handle: undefined
      }})
    ).is.anErrorWithMessage(`Function 'handle' is missing.`);
  });

  test('returns an error if handle is not a function.', async (): Promise<void> => {
    assert.that(
      parseFlowHandler({ domainEventHandler: {
        ...domainEventHandler,
        handle: {}
      }})
    ).is.anErrorWithMessage(`Property 'handle' is not a function.`);
  });
});

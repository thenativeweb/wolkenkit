import { assert } from 'assertthat';
import { parseCommandHandler } from '../../../../lib/common/parsers/parseCommandHandler';

suite('parseCommandHandler', (): void => {
  const commandHandler = {
    isAuthorized (): void {
      // Intentionally left blank.
    },
    handle (): void {
      // Intentionally left blank.
    },
    getDocumentation (): void {
      // Intentionally left blank.
    },
    getSchema (): void {
      // Intentionally left blank.
    }
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseCommandHandler({ commandHandler })
    ).is.not.anError();
  });

  test('returns an error if the given command handler is not an object.', async (): Promise<void> => {
    assert.that(
      parseCommandHandler({ commandHandler: undefined })
    ).is.anErrorWithMessage(`Property 'commandHandler' is not an object.`);
  });

  test('returns an error if isAuthorized is missing.', async (): Promise<void> => {
    assert.that(
      parseCommandHandler({ commandHandler: {
        ...commandHandler,
        isAuthorized: undefined
      }})
    ).is.anErrorWithMessage(`Function 'isAuthorized' is missing.`);
  });

  test('returns an error if isAuthorized is not a function.', async (): Promise<void> => {
    assert.that(
      parseCommandHandler({ commandHandler: {
        ...commandHandler,
        isAuthorized: {}
      }})
    ).is.anErrorWithMessage(`Property 'isAuthorized' is not a function.`);
  });

  test('returns an error if handle is missing.', async (): Promise<void> => {
    assert.that(
      parseCommandHandler({ commandHandler: {
        ...commandHandler,
        handle: undefined
      }})
    ).is.anErrorWithMessage(`Function 'handle' is missing.`);
  });

  test('returns an error if handle is not a function.', async (): Promise<void> => {
    assert.that(
      parseCommandHandler({ commandHandler: {
        ...commandHandler,
        handle: {}
      }})
    ).is.anErrorWithMessage(`Property 'handle' is not a function.`);
  });

  test('returns an error if getDocumentation is not a function.', async (): Promise<void> => {
    assert.that(
      parseCommandHandler({ commandHandler: {
        ...commandHandler,
        getDocumentation: {}
      }})
    ).is.anErrorWithMessage(`Property 'getDocumentation' is not a function.`);
  });

  test('returns an error if getSchema is not a function.', async (): Promise<void> => {
    assert.that(
      parseCommandHandler({ commandHandler: {
        ...commandHandler,
        getSchema: {}
      }})
    ).is.anErrorWithMessage(`Property 'getSchema' is not a function.`);
  });
});

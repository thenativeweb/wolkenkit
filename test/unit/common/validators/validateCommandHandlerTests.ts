import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { validateCommandHandler } from '../../../../lib/common/validators/validateCommandHandler';

suite('validateCommandHandler', (): void => {
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

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandHandler({ commandHandler });
    }).is.not.throwing();
  });

  test('throws an error if the given command handler is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandHandler({ commandHandler: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'ECOMMANDHANDLERMALFORMED' && ex.message === `Property 'commandHandler' is not an object.`);
  });

  test('throws an error if isAuthorized is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandHandler({ commandHandler: {
        ...commandHandler,
        isAuthorized: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'ECOMMANDHANDLERMALFORMED' && ex.message === `Function 'isAuthorized' is missing.`);
  });

  test('throws an error if isAuthorized is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandHandler({ commandHandler: {
        ...commandHandler,
        isAuthorized: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'ECOMMANDHANDLERMALFORMED' && ex.message === `Property 'isAuthorized' is not a function.`);
  });

  test('throws an error if handle is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandHandler({ commandHandler: {
        ...commandHandler,
        handle: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'ECOMMANDHANDLERMALFORMED' && ex.message === `Function 'handle' is missing.`);
  });

  test('throws an error if handle is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandHandler({ commandHandler: {
        ...commandHandler,
        handle: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'ECOMMANDHANDLERMALFORMED' && ex.message === `Property 'handle' is not a function.`);
  });

  test('throws an error if getDocumentation is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandHandler({ commandHandler: {
        ...commandHandler,
        getDocumentation: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'ECOMMANDHANDLERMALFORMED' && ex.message === `Property 'getDocumentation' is not a function.`);
  });

  test('throws an error if getSchema is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandHandler({ commandHandler: {
        ...commandHandler,
        getSchema: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'ECOMMANDHANDLERMALFORMED' && ex.message === `Property 'getSchema' is not a function.`);
  });
});

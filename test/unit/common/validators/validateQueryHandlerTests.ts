import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { validateQueryHandler } from '../../../../lib/common/validators/validateQueryHandler';

suite('validateQueryHandler', (): void => {
  const queryHandler = {
    type: 'stream',
    isAuthorized (): void {
      // Intentionally left blank.
    },
    handle (): void {
      // Intentionally left blank.
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler });
    }).is.not.throwing();
  });

  test('throws an error if the given query handler is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Query handler is not an object.`);
  });

  test('throws an error if type is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: {
        ...queryHandler,
        type: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Property 'type' is missing.`);
  });

  test('throws an error if type is an invalid value.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: {
        ...queryHandler,
        type: 'invalid'
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Property 'type' must either be 'value' or 'stream'.`);
  });

  test('throws an error if handle is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: {
        ...queryHandler,
        handle: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Function 'handle' is missing.`);
  });

  test('throws an error if handle is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: {
        ...queryHandler,
        handle: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Property 'handle' is not a function.`);
  });

  test('throws an error if isAuthorized is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: {
        ...queryHandler,
        isAuthorized: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Function 'isAuthorized' is missing.`);
  });

  test('throws an error if isAuthorized is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: {
        ...queryHandler,
        isAuthorized: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Property 'isAuthorized' is not a function.`);
  });

  test('throws an error if getDocumentation is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: {
        ...queryHandler,
        getDocumentation: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Property 'getDocumentation' is not a function.`);
  });

  test('throws an error if getOptionsSchema is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: {
        ...queryHandler,
        getOptionsSchema: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Property 'getOptionsSchema' is not a function.`);
  });

  test('throws an error if getItemSchema is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandler({ queryHandler: {
        ...queryHandler,
        getItemSchema: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.QueryHandlerMalformed.code && ex.message === `Property 'getItemSchema' is not a function.`);
  });
});

import assert from 'assertthat';
import { CustomError } from 'defekt';
import { validateQueryDefinition } from '../../../../lib/common/validators/validateQueryDefinition';

suite('validateQueryDefinition', (): void => {
  const queryDefinition = {
    isAuthorized (): void {
      // Intentionally left blank.
    },
    handle (): void {
      // Intentionally left blank.
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryDefinition({ queryDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the given query definition is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryDefinition({ queryDefinition: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EQUERYDEFINITIONMALFORMED' && ex.message === `Property 'queryDefinition' is not an object.`);
  });

  test('throws an error if handle is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryDefinition({ queryDefinition: {
        ...queryDefinition,
        handle: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EQUERYDEFINITIONMALFORMED' && ex.message === `Function 'handle' is missing.`);
  });

  test('throws an error if handle is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryDefinition({ queryDefinition: {
        ...queryDefinition,
        handle: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EQUERYDEFINITIONMALFORMED' && ex.message === `Property 'handle' is not a function.`);
  });

  test('throws an error if isAuthorized is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryDefinition({ queryDefinition: {
        ...queryDefinition,
        isAuthorized: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EQUERYDEFINITIONMALFORMED' && ex.message === `Function 'isAuthorized' is missing.`);
  });

  test('throws an error if isAuthorized is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryDefinition({ queryDefinition: {
        ...queryDefinition,
        isAuthorized: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EQUERYDEFINITIONMALFORMED' && ex.message === `Property 'isAuthorized' is not a function.`);
  });

  test('throws an error if getDocumentation is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryDefinition({ queryDefinition: {
        ...queryDefinition,
        getDocumentation: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EQUERYDEFINITIONMALFORMED' && ex.message === `Property 'getDocumentation' is not a function.`);
  });

  test('throws an error if getOptionsSchema is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryDefinition({ queryDefinition: {
        ...queryDefinition,
        getOptionsSchema: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EQUERYDEFINITIONMALFORMED' && ex.message === `Property 'getOptionsSchema' is not a function.`);
  });

  test('throws an error if getItemSchema is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryDefinition({ queryDefinition: {
        ...queryDefinition,
        getItemSchema: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EQUERYDEFINITIONMALFORMED' && ex.message === `Property 'getItemSchema' is not a function.`);
  });
});

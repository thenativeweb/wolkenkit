import assert from 'assertthat';
import { CustomError } from 'defekt';
import { validateProjectionDefinition } from '../../../../lib/common/validators/validateProjectionDefinition';

suite('validateProjectionDefinition', (): void => {
  const projectionDefinition = {
    selector: 'foo.bar',
    handle (): void {
      // Intentionally left blank.
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionDefinition({ projectionDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the given projection definition is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionDefinition({ projectionDefinition: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONDEFINITIONMALFORMED' && ex.message === `Property 'projectionDefinition' is not an object.`);
  });

  test('throws an error if selector is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionDefinition({ projectionDefinition: {
        ...projectionDefinition,
        selector: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONDEFINITIONMALFORMED' && ex.message === `String 'selector' is missing.`);
  });

  test('throws an error if selector is not a string.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionDefinition({ projectionDefinition: {
        ...projectionDefinition,
        selector: false
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONDEFINITIONMALFORMED' && ex.message === `Property 'selector' is not a string.`);
  });

  test('throws an error if handle is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionDefinition({ projectionDefinition: {
        ...projectionDefinition,
        handle: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONDEFINITIONMALFORMED' && ex.message === `Function 'handle' is missing.`);
  });

  test('throws an error if handle is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionDefinition({ projectionDefinition: {
        ...projectionDefinition,
        handle: false
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONDEFINITIONMALFORMED' && ex.message === `Property 'handle' is not a function.`);
  });
});

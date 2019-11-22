import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { validateProjectionHandler } from '../../../../lib/common/validators/validateProjectionHandler';

suite('validateProjectionHandler', (): void => {
  const projectionHandler = {
    selector: 'foo.bar',
    handle (): void {
      // Intentionally left blank.
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionHandler({ projectionHandler });
    }).is.not.throwing();
  });

  test('throws an error if the given projection handler is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionHandler({ projectionHandler: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONHANDLERMALFORMED' && ex.message === `Projection handler is not an object.`);
  });

  test('throws an error if selector is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionHandler({ projectionHandler: {
        ...projectionHandler,
        selector: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONHANDLERMALFORMED' && ex.message === `String 'selector' is missing.`);
  });

  test('throws an error if selector is not a string.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionHandler({ projectionHandler: {
        ...projectionHandler,
        selector: false
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONHANDLERMALFORMED' && ex.message === `Property 'selector' is not a string.`);
  });

  test('throws an error if handle is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionHandler({ projectionHandler: {
        ...projectionHandler,
        handle: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONHANDLERMALFORMED' && ex.message === `Function 'handle' is missing.`);
  });

  test('throws an error if handle is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateProjectionHandler({ projectionHandler: {
        ...projectionHandler,
        handle: false
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EPROJECTIONHANDLERMALFORMED' && ex.message === `Property 'handle' is not a function.`);
  });
});

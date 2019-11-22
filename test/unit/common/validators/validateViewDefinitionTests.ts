import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { validateViewDefinition } from '../../../../lib/common/validators/validateViewDefinition';
import { View } from '../../../../lib/common/elements/View';

suite('validateViewDefinition', (): void => {
  const viewDefinition: View<any> = {
    initializer: {
      storeType: 'foo',
      initialize (): void {
        // Intentionally left blank.
      }
    },
    projectionHandlers: {},
    queryHandlers: {}
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the given view definition is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' && ex.message === `View handler is not an object.`);
  });

  test('throws an error if initializer is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition: {
        ...viewDefinition,
        initializer: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' && ex.message === `Object 'initializer' is missing.`);
  });

  test('throws an error if initializer is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition: {
        ...viewDefinition,
        initializer: false
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' && ex.message === `Property 'initializer' is not an object.`);
  });

  test('throws an error if initializer.storeType is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition: {
        ...viewDefinition,
        initializer: {
          ...viewDefinition.initializer,
          storeType: undefined
        }
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' && ex.message === `String 'initializer.storeType' is missing.`);
  });

  test('throws an error if initializer.storeType is not a string.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition: {
        ...viewDefinition,
        initializer: {
          ...viewDefinition.initializer,
          storeType: {}
        }
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' && ex.message === `Property 'initializer.storeType' is not a string.`);
  });

  test('throws an error if initializer.initialize is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition: {
        ...viewDefinition,
        initializer: {
          ...viewDefinition.initializer,
          initialize: undefined
        }
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' && ex.message === `Function 'initializer.initialize' is missing.`);
  });

  test('throws an error if initializer.initialize is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({ viewDefinition: {
        ...viewDefinition,
        initializer: {
          ...viewDefinition.initializer,
          initialize: {}
        }
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' && ex.message === `Property 'initializer.initialize' is not a function.`);
  });

  test('throws an error if projection handlers are missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          projectionHandlers: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' &&
        ex.message === `Object 'projectionHandlers' is missing.`
    );
  });

  test('throws an error if projection handlers is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          projectionHandlers: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' &&
        ex.message === `Property 'projectionHandlers' is not an object.`
    );
  });

  test('throws an error if a malformed projection handler is found.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          projectionHandlers: {
            sampleProjection: false
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' &&
        ex.message === `Projection handler 'sampleProjection' is malformed: Projection handler is not an object.`
    );
  });

  test('throws an error if query handlers are missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          queryHandlers: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' &&
        ex.message === `Object 'queryHandlers' is missing.`
    );
  });

  test('throws an error if query handlers are not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          queryHandlers: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' &&
        ex.message === `Property 'queryHandlers' is not an object.`
    );
  });

  test('throws an error if a malformed query handler is found.', async (): Promise<void> => {
    assert.that((): void => {
      validateViewDefinition({
        viewDefinition: {
          ...viewDefinition,
          queryHandlers: {
            sampleQuery: false
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EVIEWDEFINITIONMALFORMED' &&
        ex.message === `Query handler 'sampleQuery' is malformed: Query handler is not an object.`
    );
  });
});

import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { validateDomainEventHandler } from '../../../../lib/common/validators/validateDomainEventHandler';

suite('validateDomainEventHandler', (): void => {
  const domainEventHandler = {
    isAuthorized (): void {
      // Intentionally left blank.
    },
    handle (): void {
      // Intentionally left blank.
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler });
    }).is.not.throwing();
  });

  test('throws an error if the given domain event handler is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EDOMAINEVENTHANDLERMALFORMED' && ex.message === `Property 'domainEventHandler' is not an object.`);
  });

  test('throws an error if handle is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        handle: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EDOMAINEVENTHANDLERMALFORMED' && ex.message === `Function 'handle' is missing.`);
  });

  test('throws an error if handle is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        handle: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EDOMAINEVENTHANDLERMALFORMED' && ex.message === `Property 'handle' is not a function.`);
  });

  test('throws an error if isAuthorized is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        isAuthorized: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EDOMAINEVENTHANDLERMALFORMED' && ex.message === `Function 'isAuthorized' is missing.`);
  });

  test('throws an error if isAuthorized is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        isAuthorized: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EDOMAINEVENTHANDLERMALFORMED' && ex.message === `Property 'isAuthorized' is not a function.`);
  });

  test('throws an error if getDocumentation is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        getDocumentation: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EDOMAINEVENTHANDLERMALFORMED' && ex.message === `Property 'getDocumentation' is not a function.`);
  });

  test('throws an error if getSchema is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        getSchema: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EDOMAINEVENTHANDLERMALFORMED' && ex.message === `Property 'getSchema' is not a function.`);
  });

  test('throws an error if filter is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        filter: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EDOMAINEVENTHANDLERMALFORMED' && ex.message === `Property 'filter' is not a function.`);
  });

  test('throws an error if map is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        map: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EDOMAINEVENTHANDLERMALFORMED' && ex.message === `Property 'map' is not a function.`);
  });
});

import { assert } from 'assertthat';
import { parseDomainEventHandler } from '../../../../lib/common/parsers/parseDomainEventHandler';

suite('parseDomainEventHandler', (): void => {
  const domainEventHandler = {
    isAuthorized (): void {
      // Intentionally left blank.
    },
    handle (): void {
      // Intentionally left blank.
    }
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler })
    ).is.not.anError();
  });

  test('returns an error if the given domain event handler is not an object.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler: undefined })
    ).is.anErrorWithMessage(`Property 'domainEventHandler' is not an object.`);
  });

  test('returns an error if handle is missing.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        handle: undefined
      }})
    ).is.anErrorWithMessage(`Function 'handle' is missing.`);
  });

  test('returns an error if handle is not a function.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        handle: {}
      }})
    ).is.anErrorWithMessage(`Property 'handle' is not a function.`);
  });

  test('returns an error if isAuthorized is missing.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        isAuthorized: undefined
      }})
    ).is.anErrorWithMessage(`Function 'isAuthorized' is missing.`);
  });

  test('returns an error if isAuthorized is not a function.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        isAuthorized: {}
      }})
    ).is.anErrorWithMessage(`Property 'isAuthorized' is not a function.`);
  });

  test('returns an error if getDocumentation is not a function.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        getDocumentation: {}
      }})
    ).is.anErrorWithMessage(`Property 'getDocumentation' is not a function.`);
  });

  test('returns an error if getSchema is not a function.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        getSchema: {}
      }})
    ).is.anErrorWithMessage(`Property 'getSchema' is not a function.`);
  });

  test('returns an error if filter is not a function.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        filter: {}
      }})
    ).is.anErrorWithMessage(`Property 'filter' is not a function.`);
  });

  test('returns an error if map is not a function.', async (): Promise<void> => {
    assert.that(
      parseDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        map: {}
      }})
    ).is.anErrorWithMessage(`Property 'map' is not a function.`);
  });
});

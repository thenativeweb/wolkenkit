import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { validateFlowDomainEventHandler } from '../../../../lib/common/validators/validateFlowDomainEventHandler';

suite('validateFlowDomainEventHandler', (): void => {
  const domainEventHandler = {
    isRelevant (): boolean {
      return true;
    },
    handle (): void {
      // Intentionally left blank.
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDomainEventHandler({ domainEventHandler });
    }).is.not.throwing();
  });

  test('throws an error if the given domain event handler is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDomainEventHandler({ domainEventHandler: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.FlowDomainEventHandlerMalformed.code && ex.message === `Property 'domainEventHandler' is not an object.`);
  });

  test('throws an error if is relevant is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        isRelevant: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.FlowDomainEventHandlerMalformed.code && ex.message === `Function 'isRelevant' is missing.`);
  });

  test('throws an error if is relevant is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        isRelevant: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.FlowDomainEventHandlerMalformed.code && ex.message === `Property 'isRelevant' is not a function.`);
  });

  test('throws an error if handle is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        handle: undefined
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.FlowDomainEventHandlerMalformed.code && ex.message === `Function 'handle' is missing.`);
  });

  test('throws an error if handle is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDomainEventHandler({ domainEventHandler: {
        ...domainEventHandler,
        handle: {}
      }});
    }).is.throwing((ex): boolean => (ex as CustomError).code === errors.FlowDomainEventHandlerMalformed.code && ex.message === `Property 'handle' is not a function.`);
  });
});

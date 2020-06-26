import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { Flow } from '../../../../lib/common/elements/Flow';
import { validateFlowDefinition } from '../../../../lib/common/validators/validateFlowDefinition';

suite('validateFlowDefinition', (): void => {
  const flowDefinition: Flow = {
    domainEventHandlers: {}
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDefinition({ flowDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the given flow definition is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDefinition({ flowDefinition: undefined });
    }).is.throwing((ex): boolean => (ex as CustomError).code === 'EFLOWDEFINITIONMALFORMED' && ex.message === 'Flow handler is not an object.');
  });

  test('throws an error if domain event handlers are missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDefinition({
        flowDefinition: {
          ...flowDefinition,
          domainEventHandlers: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EFLOWDEFINITIONMALFORMED' &&
        ex.message === `Object 'domainEventHandlers' is missing.`
    );
  });

  test('throws an error if domain event handlers is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDefinition({
        flowDefinition: {
          ...flowDefinition,
          domainEventHandlers: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EFLOWDEFINITIONMALFORMED' &&
        ex.message === `Property 'domainEventHandlers' is not an object.`
    );
  });

  test('throws an error if a malformed domain event handler is found.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowDefinition({
        flowDefinition: {
          ...flowDefinition,
          domainEventHandlers: {
            sampleHandler: false
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EFLOWDEFINITIONMALFORMED' &&
        ex.message === `Domain event handler 'sampleHandler' is malformed: Domain event handler is not an object.`
    );
  });
});

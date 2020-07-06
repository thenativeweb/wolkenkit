import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { FlowDefinition } from '../../../../lib/common/application/FlowDefinition';
import { validateFlowDefinition } from '../../../../lib/common/validators/validateFlowDefinition';

suite('validateFlowDefinition', (): void => {
  const flowDefinition: FlowDefinition = {
    replayPolicy: 'never',
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
        ex.message === `Domain event handler 'sampleHandler' is malformed: Property 'domainEventHandler' is not an object.`
    );
  });
});

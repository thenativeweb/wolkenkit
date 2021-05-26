import { assert } from 'assertthat';
import { FlowDefinition } from '../../../../lib/common/application/FlowDefinition';
import { parseFlow } from '../../../../lib/common/parsers/parseFlow';

suite('parseFlow', (): void => {
  const flowDefinition: FlowDefinition = {
    replayPolicy: 'never',
    domainEventHandlers: {}
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseFlow({ flowDefinition })
    ).is.not.anError();
  });

  test('returns an error if the given flow definition is not an object.', async (): Promise<void> => {
    assert.that(
      parseFlow({ flowDefinition: undefined })
    ).is.anErrorWithMessage('Flow handler is not an object.');
  });

  test('returns an error if domain event handlers are missing.', async (): Promise<void> => {
    assert.that(
      parseFlow({
        flowDefinition: {
          ...flowDefinition,
          domainEventHandlers: undefined
        }
      })
    ).is.anErrorWithMessage(`Object 'domainEventHandlers' is missing.`);
  });

  test('returns an error if domain event handlers is not an object.', async (): Promise<void> => {
    assert.that(
      parseFlow({
        flowDefinition: {
          ...flowDefinition,
          domainEventHandlers: false
        }
      })
    ).is.anErrorWithMessage(`Property 'domainEventHandlers' is not an object.`);
  });

  test('returns an error if a malformed domain event handler is found.', async (): Promise<void> => {
    assert.that(
      parseFlow({
        flowDefinition: {
          ...flowDefinition,
          domainEventHandlers: {
            sampleHandler: false
          }
        }
      })
    ).is.anErrorWithMessage(`Domain event handler 'sampleHandler' is malformed: Property 'domainEventHandler' is not an object.`);
  });
});

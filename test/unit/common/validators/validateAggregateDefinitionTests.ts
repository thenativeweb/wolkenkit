import { Aggregate } from '../../../../lib/common/elements/Aggregate';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { State } from '../../../../lib/common/elements/State';
import { validateAggregateDefinition } from '../../../../lib/common/validators/validateAggregateDefinition';

suite('validateAggregateDefinition', (): void => {
  /* eslint-disable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-useless-constructor */
  class AggregateState implements State {
    public constructor () {
      // Intentionally left blank.
    }
  }
  /* eslint-enable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-useless-constructor */

  const aggregateDefinition: Aggregate<AggregateState> = {
    getInitialState: (): AggregateState => new AggregateState(),
    commandHandlers: {},
    domainEventHandlers: {}
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateDefinition({ aggregateDefinition });
    }).is.not.throwing();
  });

  test('throws an error if getInitialState is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateDefinition({
        aggregateDefinition: {
          ...aggregateDefinition,
          getInitialState: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATEDEFINITIONMALFORMED' &&
        ex.message === `Function 'getInitialState' is missing.`
    );
  });

  test('throws an error if getInitialState is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateDefinition({
        aggregateDefinition: {
          ...aggregateDefinition,
          getInitialState: {}
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATEDEFINITIONMALFORMED' &&
        ex.message === `Property 'getInitialState' is not a function.`
    );
  });

  test('throws an error if the command handlers are missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateDefinition({
        aggregateDefinition: {
          ...aggregateDefinition,
          commandHandlers: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATEDEFINITIONMALFORMED' &&
        ex.message === `Object 'commandHandlers' is missing.`
    );
  });

  test('throws an error if the command handlers are not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateDefinition({
        aggregateDefinition: {
          ...aggregateDefinition,
          commandHandlers: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATEDEFINITIONMALFORMED' &&
        ex.message === `Property 'commandHandlers' is not an object.`
    );
  });

  test('throws an error if a malformed command handler is found.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateDefinition({
        aggregateDefinition: {
          ...aggregateDefinition,
          commandHandlers: {
            sampleCommand: false
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATEDEFINITIONMALFORMED' &&
        ex.message === `Command handler 'sampleCommand' is malformed: Property 'commandHandler' is not an object.`
    );
  });

  test('throws an error if the domain event handlers are missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateDefinition({
        aggregateDefinition: {
          ...aggregateDefinition,
          domainEventHandlers: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATEDEFINITIONMALFORMED' &&
        ex.message === `Object 'domainEventHandlers' is missing.`
    );
  });

  test('throws an error if the domain event handlers are not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateDefinition({
        aggregateDefinition: {
          ...aggregateDefinition,
          domainEventHandlers: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATEDEFINITIONMALFORMED' &&
        ex.message === `Property 'domainEventHandlers' is not an object.`
    );
  });

  test('throws an error if a malformed domain event handler is found.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateDefinition({
        aggregateDefinition: {
          ...aggregateDefinition,
          domainEventHandlers: {
            sampleDomainEvent: false
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATEDEFINITIONMALFORMED' &&
        ex.message === `Domain event handler 'sampleDomainEvent' is malformed: Property 'domainEventHandler' is not an object.`
    );
  });
});

import { Aggregate } from '../../../../lib/common/elements/Aggregate';
import { AskInfrastructure } from '../../../../lib/common/elements/AskInfrastructure';
import { assert } from 'assertthat';
import { parseAggregate } from '../../../../lib/common/parsers/parseAggregate';
import { State } from '../../../../lib/common/elements/State';
import { TellInfrastructure } from '../../../../lib/common/elements/TellInfrastructure';

suite('parseAggregate', (): void => {
  /* eslint-disable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-useless-constructor */
  class AggregateState implements State {
    public constructor () {
      // Intentionally left blank.
    }
  }
  /* eslint-enable @typescript-eslint/no-extraneous-class, @typescript-eslint/no-useless-constructor */

  const aggregateDefinition: Aggregate<AggregateState, AskInfrastructure & TellInfrastructure> = {
    getInitialState: (): AggregateState => new AggregateState(),
    commandHandlers: {},
    domainEventHandlers: {}
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseAggregate({ aggregate: aggregateDefinition })
    ).is.not.anError();
  });

  test('returns an error if getInitialState is missing.', async (): Promise<void> => {
    assert.that(
      parseAggregate({
        aggregate: {
          ...aggregateDefinition,
          getInitialState: undefined
        }
      })
    ).is.anErrorWithMessage(`Function 'getInitialState' is missing.`);
  });

  test('returns an error if getInitialState is not a function.', async (): Promise<void> => {
    assert.that(
      parseAggregate({
        aggregate: {
          ...aggregateDefinition,
          getInitialState: {}
        }
      })
    ).is.anErrorWithMessage(`Property 'getInitialState' is not a function.`);
  });

  test('returns an error if the command handlers are missing.', async (): Promise<void> => {
    assert.that(
      parseAggregate({
        aggregate: {
          ...aggregateDefinition,
          commandHandlers: undefined
        }
      })
    ).is.anErrorWithMessage(`Object 'commandHandlers' is missing.`);
  });

  test('returns an error if the command handlers are not an object.', async (): Promise<void> => {
    assert.that(
      parseAggregate({
        aggregate: {
          ...aggregateDefinition,
          commandHandlers: false
        }
      })
    ).is.anErrorWithMessage(`Property 'commandHandlers' is not an object.`);
  });

  test('returns an error if a malformed command handler is found.', async (): Promise<void> => {
    assert.that(
      parseAggregate({
        aggregate: {
          ...aggregateDefinition,
          commandHandlers: {
            sampleCommand: false
          }
        }
      })
    ).is.anErrorWithMessage(`Command handler 'sampleCommand' is malformed: Property 'commandHandler' is not an object.`);
  });

  test('returns an error if the domain event handlers are missing.', async (): Promise<void> => {
    assert.that(
      parseAggregate({
        aggregate: {
          ...aggregateDefinition,
          domainEventHandlers: undefined
        }
      })
    ).is.anErrorWithMessage(`Object 'domainEventHandlers' is missing.`);
  });

  test('returns an error if the domain event handlers are not an object.', async (): Promise<void> => {
    assert.that(
      parseAggregate({
        aggregate: {
          ...aggregateDefinition,
          domainEventHandlers: false
        }
      })
    ).is.anErrorWithMessage(`Property 'domainEventHandlers' is not an object.`);
  });

  test('returns an error if a malformed domain event handler is found.', async (): Promise<void> => {
    assert.that(
      parseAggregate({
        aggregate: {
          ...aggregateDefinition,
          domainEventHandlers: {
            sampleDomainEvent: false
          }
        }
      })
    ).is.anErrorWithMessage(`Domain event handler 'sampleDomainEvent' is malformed: Property 'domainEventHandler' is not an object.`);
  });
});

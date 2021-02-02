import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { v4 } from 'uuid';
import { validateItemIdentifier } from '../../../../lib/common/validators/validateItemIdentifier';

suite('validateItemIdentifier', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const itemIdentifier = {
    aggregateIdentifier: {
      context: { name: 'sampleContext' },
      aggregate: { name: 'sampleAggregate', id: v4() }
    },
    id: v4(),
    name: 'execute'
  };

  let application: Application;

  suiteSetup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });
  });

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateItemIdentifier({ itemIdentifier, application });
    }).is.not.throwing();
  });

  test(`throws an error if the item identifier's context doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateItemIdentifier({
        itemIdentifier: {
          ...itemIdentifier,
          aggregateIdentifier: {
            context: { name: 'someContext' },
            aggregate: itemIdentifier.aggregateIdentifier.aggregate
          }
        },
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ContextNotFound.code &&
        ex.message === `Context 'someContext' not found.`
    );
  });

  test(`throws an error if the item identifier's aggregate doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateItemIdentifier({
        itemIdentifier: {
          ...itemIdentifier,
          aggregateIdentifier: {
            context: itemIdentifier.aggregateIdentifier.context,
            aggregate: {
              name: 'someAggregate',
              id: v4()
            }
          }
        },
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.AggregateNotFound.code &&
        ex.message === `Aggregate 'sampleContext.someAggregate' not found.`
    );
  });

  test(`throws an error if the command identifier's name doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateItemIdentifier({
        itemIdentifier: {
          ...itemIdentifier,
          name: 'nonExistent'
        },
        application,
        itemType: 'command'
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.CommandNotFound.code &&
        ex.message === `Command 'sampleContext.sampleAggregate.nonExistent' not found.`
    );
  });

  test(`throws an error if the domain event identifier's name doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateItemIdentifier({
        itemIdentifier: {
          ...itemIdentifier,
          name: 'nonExistent'
        },
        application,
        itemType: 'domain-event'
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.DomainEventNotFound.code &&
        ex.message === `Domain event 'sampleContext.sampleAggregate.nonExistent' not found.`
    );
  });
});

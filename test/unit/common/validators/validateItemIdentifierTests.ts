import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { uuid } from 'uuidv4';
import { validateItemIdentifier } from '../../../../lib/common/validators/validateItemIdentifier';

suite('validateItemIdentifier', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const itemIdentifier = {
    contextIdentifier: { name: 'sampleContext' },
    aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
    id: uuid(),
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
          contextIdentifier: {
            name: 'someContext'
          }
        },
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'ECONTEXTNOTFOUND' &&
        ex.message === `Context 'someContext' not found.`
    );
  });

  test(`throws an error if the item identifier's aggregate doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateItemIdentifier({
        itemIdentifier: {
          ...itemIdentifier,
          aggregateIdentifier: {
            name: 'someAggregate',
            id: uuid()
          }
        },
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATENOTFOUND' &&
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
        (ex as CustomError).code === 'ECOMMANDNOTFOUND' &&
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
        (ex as CustomError).code === 'EDOMAINEVENTNOTFOUND' &&
        ex.message === `Domain event 'sampleContext.sampleAggregate.nonExistent' not found.`
    );
  });
});

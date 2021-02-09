import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { v4 } from 'uuid';
import { validateAggregateIdentifier } from '../../../../lib/common/validators/validateAggregateIdentifier';

suite('validateContextAndAggregateIdentifier', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const aggregateIdentifier = {
    context: { name: 'sampleContext' },
    aggregate: { name: 'sampleAggregate', id: v4() }
  };

  let application: Application;

  suiteSetup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });
  });

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateIdentifier({ aggregateIdentifier, application });
    }).is.not.throwing();
  });

  test(`throws an error if the context doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateIdentifier({
        aggregateIdentifier: {
          context: { name: 'someContext' },
          aggregate: aggregateIdentifier.aggregate
        },
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ContextNotFound.code &&
        ex.message === `Context 'someContext' not found.`
    );
  });

  test(`throws an error if the aggregate doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateIdentifier({
        aggregateIdentifier: {
          context: aggregateIdentifier.context,
          aggregate: { name: 'someAggregate', id: v4() }
        },
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.AggregateNotFound.code &&
        ex.message === `Aggregate 'sampleContext.someAggregate' not found.`
    );
  });
});

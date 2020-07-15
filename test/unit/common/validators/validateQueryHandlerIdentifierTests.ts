import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { validateQueryHandlerIdentifier } from '../../../../lib/common/validators/validateQueryHandlerIdentifier';

suite('validateQueryHandlerIdentifier', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const queryHandlerIdentifier = {
    view: { name: 'sampleView' },
    name: 'all'
  };

  let application: Application;

  suiteSetup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });
  });

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandlerIdentifier({ queryHandlerIdentifier, application });
    }).is.not.throwing();
  });

  test(`throws an error if the query handler identifier's view doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandlerIdentifier({
        queryHandlerIdentifier: {
          ...queryHandlerIdentifier,
          view: { name: 'someView' }
        },
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ViewNotFound.code &&
        ex.message === `View 'someView' not found.`
    );
  });

  test(`throws an error if the query handler identifier's name doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateQueryHandlerIdentifier({
        queryHandlerIdentifier: {
          ...queryHandlerIdentifier,
          name: 'someQueryHandler'
        },
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.QueryHandlerNotFound.code &&
        ex.message === `Query handler 'sampleView.someQueryHandler' not found.`
    );
  });
});

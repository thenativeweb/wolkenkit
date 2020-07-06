import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { validateFlowNames } from '../../../../lib/common/validators/validateFlowNames';

suite('validateFlowNames', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  let application: Application;

  suiteSetup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });
  });

  test('does not throw an error if well-known flow names are given.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowNames({ flowNames: [ 'sampleFlow' ], application });
    }).is.not.throwing();
  });

  test('throws an error if an unknown flow is given.', async (): Promise<void> => {
    assert.that((): void => {
      validateFlowNames({
        flowNames: [ 'nonExistent' ],
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EFLOWNOTFOUND' &&
        ex.message === `Flow 'nonExistent' not found.`
    );
  });
});

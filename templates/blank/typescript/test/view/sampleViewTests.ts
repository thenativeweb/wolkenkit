import { assert } from 'assertthat';
import path from 'path';
import { uuid } from 'uuidv4';
import { Application, loadApplication, sandbox } from 'wolkenkit';

suite('sampleView', (): void => {
  let application: Application;

  setup(async (): Promise<void> => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..')
    });
  });

  suite('all', (): void => {
    test('returns all items in the view.', async (): Promise<void> => {
      const aggregateId = uuid(),
            timestamp = Date.now();

      const sandboxWithApplication = sandbox().
        withApplication({ application });

      await sandboxWithApplication.
        forFlow({ flowName: 'sampleFlow' }).
        when({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
          name: 'sampleDomainEvent',
          data: {},
          metadata: {
            revision: 1,
            timestamp
          }
        }).
        then(async (): Promise<void> => {
          // Intentionally left empty.
          // The flow sandbox is ran so that data is written for the views.
        });

      const sandboxForView = sandboxWithApplication.forView({ viewName: 'sampleView' });

      const resultStream = await sandboxForView.query({
        queryName: 'all'
      });
      const resultItems = [];

      for await (const resultItem of resultStream) {
        resultItems.push(resultItem);
      }

      assert.that(resultItems).is.equalTo([
        {
          id: aggregateId,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ]);
    });
  });
});

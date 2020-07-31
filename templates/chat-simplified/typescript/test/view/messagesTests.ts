import { assert } from 'assertthat';
import path from 'path';
import { v4 } from 'uuid';
import { Application, loadApplication, sandbox } from 'wolkenkit';

suite('messages', (): void => {
  let application: Application;

  setup(async (): Promise<void> => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..')
    });
  });

  suite('all', (): void => {
    test('returns alls messages.', async (): Promise<void> => {
      const aggregateId = v4(),
            text = 'Hello world!',
            timestamp = Date.now();

      const sandboxWithApplication = sandbox().
        withApplication({ application });

      await sandboxWithApplication.
        forFlow({ flowName: 'messages' }).
        when({
          contextIdentifier: { name: 'communication' },
          aggregateIdentifier: { name: 'message', id: aggregateId },
          name: 'sent',
          data: { text },
          metadata: { revision: 1, timestamp }
        }).
        and({
          contextIdentifier: { name: 'communication' },
          aggregateIdentifier: { name: 'message', id: aggregateId },
          name: 'liked',
          data: { likes: 5 },
          metadata: { revision: 2, timestamp }
        }).
        then(async (): Promise<void> => {
          // Run the flow sandbox so that data gets written for the views, but
          // do not do any assertions here.
        });

      const sandboxForView = sandboxWithApplication.forView({ viewName: 'messages' });

      const resultStream = await sandboxForView.query({ queryName: 'all' });
      const resultItems = [];

      for await (const resultItem of resultStream) {
        resultItems.push(resultItem);
      }

      assert.that(resultItems).is.equalTo([
        {
          id: aggregateId,
          timestamp,
          text,
          likes: 5
        }
      ]);
    });
  });
});

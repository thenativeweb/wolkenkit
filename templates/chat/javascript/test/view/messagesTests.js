'use strict';

const { assert } = require('assertthat');
const path = require('path');
const { uuid } = require('uuidv4');
const { loadApplication, sandbox } = require('wolkenkit');

suite('messages', () => {
  let application;

  setup(async () => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..')
    });
  });

  suite('all', () => {
    test('returns alls messages.', async () => {
      const aggregateId = uuid(),
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
          metadata: {
            revision: 1,
            timestamp
          }
        }).
        and({
          contextIdentifier: { name: 'communication' },
          aggregateIdentifier: { name: 'message', id: aggregateId },
          name: 'liked',
          data: { likes: 5 },
          metadata: {
            revision: 2,
            timestamp
          }
        }).
        then(async () => {
          // Intentionally left empty.
        // The flow sandbox is ran so that data is written for the views.
        });

      const sandboxForView = sandboxWithApplication.forView({ viewName: 'messages' });

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
          timestamp,
          text,
          likes: 5
        }
      ]);
    });
  });
});

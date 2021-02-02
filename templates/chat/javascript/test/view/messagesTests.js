'use strict';

const path = require('path');

const { assert } = require('assertthat'),
      { v4 } = require('uuid'),
      { loadApplication, sandbox } = require('wolkenkit');

suite('messages', () => {
  let application;

  setup(async () => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..')
    });
  });

  suite('all', () => {
    test('returns alls messages.', async () => {
      const aggregateId = v4(),
            text = 'Hello world!',
            timestamp = Date.now();

      const sandboxWithApplication = sandbox().
        withApplication({ application });

      await sandboxWithApplication.
        forFlow({ flowName: 'messages' }).
        when({
          aggregateIdentifier: {
            context: { name: 'communication' },
            aggregate: { name: 'message', id: aggregateId }
          },
          name: 'sent',
          data: { text },
          metadata: {
            revision: 1,
            timestamp
          }
        }).
        and({
          aggregateIdentifier: {
            context: { name: 'communication' },
            aggregate: { name: 'message', id: aggregateId }
          },
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

  suite('notifications', () => {
    test('publishes view updated notifications in response to flow updated notifications.', async () => {
      const notifications = [];
      const publisher = {
        async publish ({ channel, message }) {
          notifications.push({ channel, notification: message });
        }
      };

      const sandboxForView = sandbox().
        withApplication({ application }).
        withPublisher({ publisher }).
        forView({ viewName: 'messages' });

      await sandboxForView.notify({ notification: { name: 'flowMessagesUpdated', data: {}}});

      assert.that(notifications.length).is.equalTo(1);
      assert.that(notifications[0]).is.equalTo({
        channel: 'notifications',
        notification: {
          name: 'viewMessagesUpdated',
          data: {},
          metadata: undefined
        }
      });
    });
  });
});

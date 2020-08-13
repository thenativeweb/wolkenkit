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

  test('adds sent messages to the messages view.', async () => {
    const aggregateId = v4(),
          text = 'Hello world!',
          timestamp = Date.now();

    await sandbox().
      withApplication({ application }).
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
      then(async () => {
        const { messages } = application.infrastructure.tell.viewStore;

        assert.that(messages.length).is.equalTo(1);
        assert.that(messages[0]).is.equalTo({
          id: aggregateId,
          timestamp,
          text,
          likes: 0
        });
      });
  });

  test('increases likes.', async () => {
    const aggregateId = v4();

    await sandbox().
      withApplication({ application }).
      forFlow({ flowName: 'messages' }).
      when({
        contextIdentifier: { name: 'communication' },
        aggregateIdentifier: { name: 'message', id: aggregateId },
        name: 'sent',
        data: { text: 'Hello world!' },
        metadata: {
          revision: 1
        }
      }).
      and({
        contextIdentifier: { name: 'communication' },
        aggregateIdentifier: { name: 'message', id: aggregateId },
        name: 'liked',
        data: { likes: 5 },
        metadata: {
          revision: 2
        }
      }).
      then(async () => {
        const { messages } = application.infrastructure.tell.viewStore;

        assert.that(messages.length).is.equalTo(1);
        assert.that(messages[0]).is.atLeast({
          id: aggregateId,
          likes: 5
        });
      });
  });

  test('publishes flow updated notification.', async () => {
    const aggregateId = v4();

    const notifications = [];
    const publisher = {
      async publish ({ channel, message }) {
        notifications.push({ channel, notification: message });
      }
    };

    await sandbox().
      withApplication({ application }).
      withPublisher({ publisher }).
      forFlow({ flowName: 'messages' }).
      when({
        contextIdentifier: { name: 'communication' },
        aggregateIdentifier: { name: 'message', id: aggregateId },
        name: 'sent',
        data: { text: 'Hello world!' },
        metadata: { revision: 1 }
      }).
      then(async () => {
        assert.that(notifications.length).is.equalTo(1);
        assert.that(notifications[0]).is.equalTo({
          channel: 'notifications',
          notification: {
            name: 'flowMessagesUpdated',
            data: {},
            metadata: undefined
          }
        });
      });
  });
});

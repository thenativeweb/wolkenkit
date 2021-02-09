'use strict';

const path = require('path');

const { assert } = require('assertthat'),
      { v4 } = require('uuid'),
      { loadApplication, sandbox } = require('wolkenkit');

suite('message', () => {
  let application;

  suiteSetup(async () => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..', '..')
    });
  });

  suite('send', () => {
    test('sends a message.', async () => {
      const aggregateIdentifier = {
        context: { name: 'communication' },
        aggregate: { name: 'message', id: v4() }
      };

      await sandbox().
        withApplication({ application }).
        forAggregate({ aggregateIdentifier }).
        when({ name: 'send', data: { text: 'Hello world!' }}).
        then(({ domainEvents, state }) => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('sent');
          assert.that(domainEvents[0].data).is.equalTo({ text: 'Hello world!' });
          assert.that(state).is.equalTo({ text: 'Hello world!', likes: 0 });
        });
    });

    test('fails if the message was already sent.', async () => {
      const aggregateIdentifier = {
        context: { name: 'communication' },
        aggregate: { name: 'message', id: v4() }
      };

      await sandbox().
        withApplication({ application }).
        forAggregate({ aggregateIdentifier }).
        given({ name: 'sent', data: { text: 'Hello world!' }}).
        when({ name: 'send', data: { text: 'Hello world!' }}).
        then(({ domainEvents, state }) => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('sendRejected');
          assert.that(domainEvents[0].data).is.equalTo({ reason: 'Message was already sent.' });
          assert.that(state).is.equalTo({ text: 'Hello world!', likes: 0 });
        });
    });
  });

  suite('like', () => {
    test('likes a message.', async () => {
      const aggregateIdentifier = {
        context: { name: 'communication' },
        aggregate: { name: 'message', id: v4() }
      };

      await sandbox().
        withApplication({ application }).
        forAggregate({ aggregateIdentifier }).
        given({ name: 'sent', data: { text: 'Hello world!' }}).
        when({ name: 'like', data: {}}).
        then(({ domainEvents, state }) => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('liked');
          assert.that(domainEvents[0].data).is.equalTo({ likes: 1 });
          assert.that(state).is.equalTo({ text: 'Hello world!', likes: 1 });
        });
    });

    test('fails if the message was not yet sent.', async () => {
      const aggregateIdentifier = {
        context: { name: 'communication' },
        aggregate: { name: 'message', id: v4() }
      };

      await sandbox().
        withApplication({ application }).
        forAggregate({ aggregateIdentifier }).
        when({ name: 'like', data: {}}).
        then(({ domainEvents, state }) => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('likeRejected');
          assert.that(domainEvents[0].data).is.equalTo({ reason: 'Message was not yet sent.' });
          assert.that(state).is.equalTo({ text: '', likes: 0 });
        });
    });
  });
});

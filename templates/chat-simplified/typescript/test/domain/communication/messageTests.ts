import { assert } from 'assertthat';
import path from 'path';
import { uuid } from 'uuidv4';
import { Application, loadApplication, sandbox } from 'wolkenkit';
import { LikeData, SendData, SentData } from '../../../server/domain/communication/message';

suite('message', (): void => {
  let application: Application;

  suiteSetup(async (): Promise<void> => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..', '..')
    });
  });

  suite('send', (): void => {
    test('sends a message.', async (): Promise<void> => {
      const contextIdentifier = { name: 'communication' };
      const aggregateIdentifier = { name: 'message', id: uuid() };

      await sandbox().
        withApplication({ application }).
        forAggregate({ contextIdentifier, aggregateIdentifier }).
        when<SendData>({ name: 'send', data: { text: 'Hello world!' }}).
        then(({ domainEvents, state }): void => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('sent');
          assert.that(domainEvents[0].data).is.equalTo({ text: 'Hello world!' });
          assert.that(state).is.equalTo({ text: 'Hello world!', likes: 0 });
        });
    });

    test('fails if the message was already sent.', async (): Promise<void> => {
      const contextIdentifier = { name: 'communication' };
      const aggregateIdentifier = { name: 'message', id: uuid() };

      await sandbox().
        withApplication({ application }).
        forAggregate({ contextIdentifier, aggregateIdentifier }).
        given<SentData>({ name: 'sent', data: { text: 'Hello world!' }}).
        when<SendData>({ name: 'send', data: { text: 'Hello world!' }}).
        then(({ domainEvents, state }): void => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('sendRejected');
          assert.that(domainEvents[0].data).is.equalTo({ reason: 'Message was already sent.' });
          assert.that(state).is.equalTo({ text: 'Hello world!', likes: 0 });
        });
    });
  });

  suite('like', (): void => {
    test('likes a message.', async (): Promise<void> => {
      const contextIdentifier = { name: 'communication' };
      const aggregateIdentifier = { name: 'message', id: uuid() };

      await sandbox().
        withApplication({ application }).
        forAggregate({ contextIdentifier, aggregateIdentifier }).
        given<SentData>({ name: 'sent', data: { text: 'Hello world!' }}).
        when<LikeData>({ name: 'like', data: {}}).
        then(({ domainEvents, state }): void => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('liked');
          assert.that(domainEvents[0].data).is.equalTo({ likes: 1 });
          assert.that(state).is.equalTo({ text: 'Hello world!', likes: 1 });
        });
    });

    test('fails if the message was not yet sent.', async (): Promise<void> => {
      const contextIdentifier = { name: 'communication' };
      const aggregateIdentifier = { name: 'message', id: uuid() };

      await sandbox().
        withApplication({ application }).
        forAggregate({ contextIdentifier, aggregateIdentifier }).
        when<LikeData>({ name: 'like', data: {}}).
        then(({ domainEvents, state }): void => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('likeRejected');
          assert.that(domainEvents[0].data).is.equalTo({ reason: 'Message was not yet sent.' });
          assert.that(state).is.equalTo({ text: '', likes: 0 });
        });
    });
  });
});

import { assert } from 'assertthat';
import { Infrastructure } from "../../server/infrastructure";
import { Message } from "../../server/types/Message";
import path from 'path';
import { uuid } from 'uuidv4';
import { Application, loadApplication, sandbox } from 'wolkenkit';

suite('messages', (): void => {
  let application: Application;

  setup(async (): Promise<void> => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..')
    });
  });

  test('adds sent messages to the messages view.', async (): Promise<void> => {
    const aggregateId = uuid(),
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
        const messages = (application.infrastructure as Infrastructure).tell.viewStore.messages as Message[];

        assert.that(messages.length).is.equalTo(1);
        assert.that(messages[0]).is.equalTo({
          id: aggregateId,
          timestamp,
          text,
          likes: 0
        });
      });
  });

  test('increases likes.', async (): Promise<void> => {
    const aggregateId = uuid();

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
        const messages = (application.infrastructure as Infrastructure).tell.viewStore.messages as Message[];

        assert.that(messages.length).is.equalTo(1);
        assert.that(messages[0]).is.atLeast({
          id: aggregateId,
          likes: 5
        });
      });
  });
});

import { Message } from '../../../../chat/typescript/server/types/Message';
import { processenv } from 'processenv';
import { Collection, MongoClient } from 'mongodb';
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';

const getInfrastructure = async function (): Promise<AskInfrastructure & TellInfrastructure> {
  const url = processenv('MONGODB_URL') as string;
  let messages: Collection<Message> | Message[] = [];

  if (url) {
    const connection = await MongoClient.connect(url, {
      w: 1,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    messages = connection.db().collection('messages');
  }

  return {
    ask: {
      viewStore: {
        messages
      }
    },
    tell: {
      viewStore: {
        messages
      }
    }
  };
}

export { getInfrastructure };

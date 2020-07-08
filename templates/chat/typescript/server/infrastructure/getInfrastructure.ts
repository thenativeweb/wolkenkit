import { Message } from '../types/Message';
import { processenv } from 'processenv';
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';
import { Collection, MongoClient } from 'mongodb';

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
    ask: {},
    tell: {
      viewStore: {
        messages
      }
    }
  };
};

export { getInfrastructure };

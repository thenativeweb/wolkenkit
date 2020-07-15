import { Infrastructure } from '.';
import { Message } from '../types/Message';
import { processenv } from 'processenv';
import { Collection, MongoClient } from 'mongodb';

const getInfrastructure = async function (): Promise<Infrastructure> {
  const url = processenv('MONGODB_URL') as string;
  let messages: Collection<Message> | Message[] = [];

  if (url) {
    const connection = await MongoClient.connect(url, {
      // eslint-disable-next-line id-length
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
};

export { getInfrastructure };

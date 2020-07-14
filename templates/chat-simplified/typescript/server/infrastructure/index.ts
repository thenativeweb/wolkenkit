import { Message } from '../types/Message';
import { processenv } from 'processenv';
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';
import { Collection, MongoClient } from 'mongodb';

export interface Infrastructure extends AskInfrastructure, TellInfrastructure {
  ask: {
    viewStore: {
      messages: Collection<Message> | Message[];
    };
  };
  tell: {
    viewStore: {
      messages: Collection<Message> | Message[];
    };
  };
}

const getInfrastructure = async function (): Promise<AskInfrastructure & TellInfrastructure> {
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

const setupInfrastructure = async function (): Promise<void> {
  // Intentionally left blank.
};

export default { setupInfrastructure, getInfrastructure };

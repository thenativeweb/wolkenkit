import { Message } from '../../../../chat/typescript/server/types/Message';
import { processenv } from 'processenv';
import { Collection, MongoClient } from 'mongodb';
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';

const getInfrastructure = async function (): Promise<AskInfrastructure & TellInfrastructure> {
  const url = processenv('MONGODB_URL') as string;
  let aggregates: Collection<Message> | Message[] = [];

  if (url) {
    const connection = await MongoClient.connect(url, {
      w: 1,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    aggregates = connection.db().collection('aggregates');
  }

  return {
    ask: {
      viewStore: {
        aggregates
      }
    },
    tell: {
      viewStore: {
        aggregates
      }
    }
  };
}

export { getInfrastructure };

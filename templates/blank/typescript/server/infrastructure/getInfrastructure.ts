import { AggregateItem } from '../types/AggregateItem';
import { processenv } from 'processenv';
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';
import { Collection, MongoClient } from 'mongodb';

const getInfrastructure = async function (): Promise<AskInfrastructure & TellInfrastructure> {
  const url = processenv('MONGODB_URL') as string;
  let aggregates: Collection<AggregateItem> | AggregateItem[] = [];

  if (url) {
    const connection = await MongoClient.connect(url, {
      // eslint-disable-next-line id-length
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
};

export { getInfrastructure };

import { Message } from '../types/Message';
import { Collection } from 'mongodb';
import { getInfrastructure } from './getInfrastructure';
import { setupInfrastructure } from './setupInfrastructure';
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';

export interface Infrastructure extends AskInfrastructure, TellInfrastructure {
  ask: {
    viewStore: {
      messages: Collection<Message> | Message[];
    }
  };
  tell: {
    viewStore: {
      messages: Collection<Message> | Message[];
    };
  };
}

export default { setupInfrastructure, getInfrastructure };

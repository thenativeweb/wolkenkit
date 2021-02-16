import { Flow } from 'wolkenkit';
import { handleMessageLiked } from './handlers/handleMessageLiked';
import { handleMessageSent } from './handlers/handleMessageSent';
import { Infrastructure } from '../../infrastructure';

const messages: Flow<Infrastructure> = {
  replayPolicy: 'always',

  domainEventHandlers: {
    handleMessageSent,
    handleMessageLiked
  }
};

export default messages;

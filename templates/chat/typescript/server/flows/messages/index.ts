import { Flow } from 'wolkenkit';
import { handleMessageLiked } from './handlers/handleMessageLiked';
import { handleMessageSent } from './handlers/handleMessageSent';

const messages: Flow = {
  replayPolicy: 'always',

  domainEventHandlers: {
    handleMessageSent,
    handleMessageLiked
  }
};

export default messages;

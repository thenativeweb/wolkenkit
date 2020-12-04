import { all } from './queries/all';
import { Infrastructure } from '../../infrastructure';
import { View } from 'wolkenkit';

const sampleView: View<Infrastructure> = {
  queryHandlers: {
    all
  },

  notificationSubscribers: {}
};

export default sampleView;

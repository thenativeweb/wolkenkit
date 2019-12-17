import { errors } from '../../common/errors';
import { InMemorySubscriber } from './InMemory/InMemorySubscriber';
import { Subscriber } from '../../messaging/pubSub/Subscriber';

const createSubscriber = async function<T extends object> ({
  type,
  /* eslint-disable @typescript-eslint/no-unused-vars */
  options
  /* eslint-enable @typescript-eslint/no-unused-vars */
}: {
  type: string;
  options: any;
}): Promise<Subscriber<T>> {
  switch (type) {
    case 'InMemory': {
      return await InMemorySubscriber.create();
    }
    default: {
      throw new errors.SubscriberTypeInvalid();
    }
  }
};

export {
  createSubscriber
};

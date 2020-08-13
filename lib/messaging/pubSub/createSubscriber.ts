import { errors } from '../../common/errors';
import { HttpSubscriber } from './Http/HttpSubscriber';
import { InMemorySubscriber } from './InMemory/InMemorySubscriber';
import { Subscriber } from './Subscriber';
import { SubscriberOptions } from './SubscriberOptions';

const createSubscriber = async function<T extends object> (options: SubscriberOptions): Promise<Subscriber<T>> {
  switch (options.type) {
    case 'InMemory': {
      return await InMemorySubscriber.create(options);
    }
    case 'Http': {
      return await HttpSubscriber.create(options);
    }
    default: {
      throw new errors.SubscriberTypeInvalid();
    }
  }
};

export { createSubscriber };

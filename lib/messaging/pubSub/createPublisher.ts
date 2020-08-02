import { errors } from '../../common/errors';
import { InMemoryPublisher } from './InMemory/InMemoryPublisher';
import { Publisher } from './Publisher';
import { PublisherOptions } from './PublisherOptions';

const createPublisher = async function<T extends object> (options: PublisherOptions): Promise<Publisher<T>> {
  switch (options.type) {
    case 'InMemory': {
      return await InMemoryPublisher.create(options);
    }
    default: {
      throw new errors.PublisherTypeInvalid();
    }
  }
};

export { createPublisher };

import { errors } from '../../common/errors';
import { InMemoryPublisher } from './InMemory/InMemoryPublisher';
import { Publisher } from '../../messaging/pubSub/Publisher';

const createPublisher = async function<T extends object> ({
  type,
  /* eslint-disable @typescript-eslint/no-unused-vars */
  options
  /* eslint-enable @typescript-eslint/no-unused-vars */
}: {
  type: string;
  options: any;
}): Promise<Publisher<T>> {
  switch (type) {
    case 'InMemory': {
      return await InMemoryPublisher.create();
    }
    default: {
      throw new errors.PublisherTypeInvalid();
    }
  }
};

export {
  createPublisher
};

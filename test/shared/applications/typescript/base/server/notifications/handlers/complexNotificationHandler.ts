import { ComplexNotificationDefinition } from "../definitions/ComplexNotificationDefinition";
import { Infrastructure } from '../../infrastructure';
// @ts-ignore
import { NotificationHandler, Schema } from 'wolkenkit';

const complexNotificationHandler: NotificationHandler<ComplexNotificationDefinition, Infrastructure> = {
  getDataSchema (): Schema {
    return {
      type: 'object',
      properties: {
        message: { type: 'string', minLength: 1 }
      },
      required: [ 'message' ]
    };
  },

  getMetadataSchema (): Schema {
    return {
      type: 'object',
      properties: {
        public: { type: 'boolean' }
      },
      required: [ 'public' ]
    };
  },

  isAuthorized (data: ComplexNotificationDefinition['data'], metadata: ComplexNotificationDefinition['metadata']): boolean {
    return metadata.public;
  }
};

export { complexNotificationHandler };

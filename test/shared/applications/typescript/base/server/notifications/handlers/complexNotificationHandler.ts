import { ComplexNotificationDefinition } from "../definitions/ComplexNotificationDefinition";
import { Infrastructure } from '../../infrastructure';
// @ts-ignore
import { ApiSchema, NotificationHandler } from 'wolkenkit';

const complexNotificationHandler: NotificationHandler<ComplexNotificationDefinition, Infrastructure> = {
  getDataSchema (): ApiSchema {
    return {
      type: 'object',
      properties: {
        message: { type: 'string', minLength: 1 }
      },
      required: [ 'message' ],
      additionalProperties: false
    };
  },

  getMetadataSchema (): ApiSchema {
    return {
      type: 'object',
      properties: {
        public: { type: 'boolean' }
      },
      required: [ 'public' ],
      additionalProperties: false
    };
  },

  isAuthorized (data: ComplexNotificationDefinition['data'], metadata: ComplexNotificationDefinition['metadata']): boolean {
    return metadata.public;
  }
};

export { complexNotificationHandler };

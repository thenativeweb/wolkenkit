'use strict';

const complexNotificationHandler = {
  getDataSchema () {
    return {
      type: 'object',
      properties: {
        message: { type: 'string', minLength: 1 }
      },
      required: [ 'message' ]
    };
  },

  getMetadataSchema () {
    return {
      type: 'object',
      properties: {
        public: { type: 'boolean' }
      },
      required: [ 'public' ]
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = { complexNotificationHandler };
